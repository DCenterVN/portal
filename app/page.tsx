import {ResortConsole} from "@/features/console/resort-console";
import {getInitialConsoleData} from "@/lib/mock-data";

export default function Home() {
  return <ResortConsole initialData={getInitialConsoleData()} />;
}
