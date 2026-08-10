import { AppointmentForm } from "@/components/services/AppointmentForm";

export default function AppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 lg:px-8">
      <h1 className="mb-2 font-display text-3xl">Book an Appointment</h1>
      <p className="mb-8 text-sm text-text-dark/60">
        Not sure what to buy online? Book a styling consultation, engraving, or try-on at your nearest store.
      </p>
      <AppointmentForm />
    </div>
  );
}
