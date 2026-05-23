export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 'bold', letterSpacing: '0.2em' }}>
        VEKTR
      </h1>
      <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.7 }}>
        Pickleball Platform · Demo Site
      </p>
      <p style={{ marginTop: '2rem', fontSize: '0.85rem', opacity: 0.4 }}>
        Coming Soon
      </p>
    </main>
  );
}
