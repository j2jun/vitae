import { Show } from "@clerk/nextjs";
import WeatherCheckup from "@/components/WeatherCheckup";
import PushSubscribe from "@/components/PushSubscribe";
import CalendarCheckup from "@/components/CalendarCheckup";

export default function Home() {
  return (
    <main>
      <WeatherCheckup />
      <Show when="signed-in">
        <PushSubscribe />
        <CalendarCheckup />
      </Show>
    </main>
  );
}
