import { Show } from "@clerk/nextjs";
import WeatherCheckup from "@/components/WeatherCheckup";
import PushSubscribe from "@/components/PushSubscribe";

export default function Home() {
  return (
    <main>
      <WeatherCheckup />
      <Show when="signed-in">
        <PushSubscribe />
      </Show>
    </main>
  );
}
