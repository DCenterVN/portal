import {StaffProfileContainer} from "@/features/staff-profile/staff-profile-container";
import {AccountEditContainer} from "@/features/account-edit/account-edit-container";
export default function StaffAccountPage() {
 return <StaffProfileContainer editor={<AccountEditContainer loginPath="/staff/login"/>}/>;
}
