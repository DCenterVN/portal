"""Validate planning structure only; never approves or checks implementation."""
import importlib.util
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[3]
engine = Path.home() / "agent_skills/sdlc/engine/sdlc.py"
sys.path.insert(0, str(engine.parent))
spec = importlib.util.spec_from_file_location("sdlc", engine)
sdlc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sdlc)
plan = Path(__file__).with_name("plan.md").read_text()
policy = json.loads((root / ".aidlc/stage-policy.json").read_text())
problems = sdlc.plan_problems(policy, plan)
assert not problems, problems
slices = sdlc.slices(plan)
assert len(slices) == 16 and not any(done for _, done, _ in slices)
assert max(len(sdlc.slice_parts(body)[0]) for _, _, body in slices) <= 5
fr = set(re.findall(r"FR-(\d+):", plan))
ac = set(re.findall(r"AC-(\d+):", plan))
assert len(fr) == 10 and len(ac) == 19, (fr, ac)
assert not Path(__file__).with_name("artifacts").joinpath("plan-approval.json").exists()
assert not re.search(r"\[ASSUMED\]", plan)
print("planning PASS: FR=10 AC=19 slices=16 pending=16 max_files_per_slice=5 structural_errors=0 approval=absent")
