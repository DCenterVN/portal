export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  status: "completed" | "pending" | "processing";
  branch: string;
}

export const MOCK_DASHBOARD_METRICS: DashboardMetric[] = [
  {
    id: "occupancy",
    label: "Tỷ lệ lấp đầy Kho Lạnh (-18,5°C)",
    value: "84.2%",
    change: "+3.5% sức chứa so với hôm qua",
    changeType: "positive",
  },
  {
    id: "arrivals",
    label: "Lô hàng nhập kho hôm nay",
    value: "38 lô",
    change: "12 lô đã qua kiểm định QC VietGAP",
    changeType: "positive",
  },
  {
    id: "revenue",
    label: "Doanh thu xuất kho & phân phối",
    value: "128.500.000 ₫",
    change: "+12% so với kế hoạch tuần",
    changeType: "positive",
  },
  {
    id: "tasks",
    label: "Cảnh báo QC & Lưu kho cần duyệt",
    value: "5 lô",
    change: "Cần xử lý trước giờ xuất xe lạnh",
    changeType: "negative",
  },
];

export const MOCK_ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: "act-1",
    title: "Lô rau củ VietGAP Đà Lạt (1.200kg) đạt chuẩn QC độ tươi 98%",
    time: "10 phút trước",
    status: "completed",
    branch: "Hub Tổng Kho Long Hậu",
  },
  {
    id: "act-2",
    title: "Cảm biến IoT Kho Lạnh B3 duy trì nhiệt độ chuẩn -18.5°C",
    time: "35 phút trước",
    status: "completed",
    branch: "Kho Lạnh Trung Tâm",
  },
  {
    id: "act-3",
    title: "Đơn cung ứng thịt heo sinh học 450kg đã bàn giao Hub Quận 7",
    time: "1 giờ trước",
    status: "completed",
    branch: "Hub Bán Lẻ Q.7",
  },
  {
    id: "act-4",
    title: "Xe lạnh số 04 xuất bến điều phối 30 điểm phân phối nội đô",
    time: "2 giờ trước",
    status: "processing",
    branch: "Đội xe Logistics 04",
  },
];

export const MOCK_BRANCHES = [
  {
    id: "hub-long-hau",
    name: "Hub Tổng Kho Long Hậu",
    type: "cold_hub" as const,
    status: "active" as const,
    location: "KCN Long Hậu, Cần Giuộc",
  },
  {
    id: "hub-q7",
    name: "Hub Phân Phối Quận 7",
    type: "distribution" as const,
    status: "active" as const,
    location: "Nguyễn Thị Thập, P. Tân Phong, Q.7",
  },
  {
    id: "branch-tay-ho",
    name: "Chi nhánh Tây Hồ - Kho Lạnh Trung Tâm",
    type: "cold_hub" as const,
    status: "active" as const,
    location: "Xuân Diệu, Quảng An, Tây Hồ",
  },
];

