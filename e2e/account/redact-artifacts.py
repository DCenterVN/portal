import base64
import io
import json
import re
import sys
import zipfile
from pathlib import Path

accounts = Path.home() / "work/ticket/.cache/e2e/accounts.env"
passwords = []
for line in accounts.read_text().splitlines():
    if re.match(r"E2E_\w+_PASSWORD=", line):
        passwords.append(line.split("=", 1)[1].strip().strip("\"\x27"))
secret_keys = re.compile(r"^(?:.*password|.*token|authorization|cookie|set-cookie|x-csrf-token|x-amz-signature|x-amz-credential|policy|signature)$", re.I)


def clean_text(value):
    for password in passwords:
        if password:
            value = value.replace(password, "[REDACTED]")
    value = re.sub(r"E2e-account-[a-f0-9]{32}!", "[REDACTED]", value)
    value = re.sub(r"(confirmation page:\s*)[A-Za-z0-9_-]{32,}", r"\1[REDACTED]", value)
    value = re.sub(r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?", "[REDACTED]", value)
    value = re.sub(r"(?i)([?&](?:amp;)?(?:token|x-amz-signature|x-amz-credential)=)[^\s<>\"\x27&\\]+", r"\1[REDACTED]", value)
    value = re.sub(r"(?:\+84|0)(?:911222333|944555666|988777666)", "[REDACTED_PHONE]", value)
    return value


def clean_json(value):
    if isinstance(value, list):
        return [clean_json(item) for item in value]
    if isinstance(value, dict):
        if "postData" in value:
            value["postData"] = {"mimeType": value["postData"].get("mimeType", ""), "text": "[REDACTED]"}
        if secret_keys.fullmatch(str(value.get("name", ""))) and "value" in value:
            value["value"] = "[REDACTED]"
        return {key: "[REDACTED]" if secret_keys.fullmatch(key) else clean_json(item) for key, item in value.items()}
    if isinstance(value, str):
        return clean_text(value)
    return value


def clean_zip(data):
    output = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(data)) as source, zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
        for entry in source.infolist():
            target.writestr(entry, clean_bytes(source.read(entry)))
    return output.getvalue()


def clean_bytes(data):
    if data.startswith(b"PK\x03\x04"):
        return clean_zip(data)
    try:
        value = data.decode("utf-8")
    except UnicodeDecodeError:
        return data
    try:
        value = json.dumps(clean_json(json.loads(value)), ensure_ascii=False)
    except (json.JSONDecodeError, ValueError):
        lines = []
        for line in value.splitlines(keepends=True):
            try:
                lines.append(json.dumps(clean_json(json.loads(line)), ensure_ascii=False) + "\n")
            except (json.JSONDecodeError, ValueError):
                lines.append(clean_text(line))
        value = "".join(lines)
    def embedded(match):
        return match[1] + base64.b64encode(clean_zip(base64.b64decode(match[2]))).decode()
    value = re.sub(r"(data:application/zip;base64,)([A-Za-z0-9+/=]+)", embedded, value)
    return clean_text(value).encode("utf-8")


for root in sys.argv[1:]:
    for path in Path(root).rglob("*"):
        if path.is_file() and path.suffix not in {".webm", ".png", ".jpg", ".woff2"}:
            data = path.read_bytes()
            cleaned = clean_bytes(data)
            if data != cleaned:
                path.write_bytes(cleaned)
print("Đã lọc mật khẩu, cookie, token và liên kết xác nhận khỏi artifacts.")
