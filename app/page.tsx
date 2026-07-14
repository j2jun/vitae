import { Show } from "@clerk/nextjs";
import WeatherCheckup from "@/components/WeatherCheckup";
import PushSubscribe from "@/components/PushSubscribe";
import CalendarCheckup from "@/components/CalendarCheckup";
import TodoList from "@/components/TodoList";
import NewsCheckup from "@/components/NewsCheckup";
import TrafficCheckup from "@/components/TrafficCheckup";

export default function Home() {
  return (
    <main>
      <WeatherCheckup />
      <Show when="signed-in">
        <PushSubscribe />
        <CalendarCheckup />
        <TodoList />
        <NewsCheckup />
        <TrafficCheckup />
      </Show>
    </main>
  );
}
