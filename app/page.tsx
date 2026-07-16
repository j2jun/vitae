import { Show } from "@clerk/nextjs";
import WeatherCheckup from "@/components/WeatherCheckup";
import PushSubscribe from "@/components/PushSubscribe";
import CalendarCheckup from "@/components/CalendarCheckup";
import TodoList from "@/components/TodoList";
import NewsCheckup from "@/components/NewsCheckup";
import TrafficCheckup from "@/components/TrafficCheckup";
import StockWatchlist from "@/components/StockWatchlist";

export default function Home() {
  return (
    <main className="dashboard">
      <section className="card">
        <h2>Weather</h2>
        <WeatherCheckup />
      </section>
      <Show when="signed-in">
        <section className="card">
          <h2>Alerts</h2>
          <PushSubscribe />
        </section>
        <section className="card">
          <h2>Calendar</h2>
          <CalendarCheckup />
        </section>
        <section className="card">
          <h2>To-dos</h2>
          <TodoList />
        </section>
        <section className="card">
          <h2>News</h2>
          <NewsCheckup />
        </section>
        <section className="card">
          <h2>Traffic</h2>
          <TrafficCheckup />
        </section>
        <section className="card">
          <h2>Stocks</h2>
          <StockWatchlist />
        </section>
      </Show>
    </main>
  );
}
