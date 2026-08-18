import { Header } from '../components/header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-surface">
        <h1 className="text-headline-xl text-on-surface">
          Biashara Mall — Admin
        </h1>
        <p className="text-body-md text-on-surface-variant">
          admin-ui is running
        </p>
      </main>
    </>
  );
}
