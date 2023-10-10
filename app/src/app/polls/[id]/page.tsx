export default function PollDetails({ params }: { params: { id: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>Polls ID: {params.id}</div>
    </main>
  );
}
