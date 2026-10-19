import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-gold">
      <h1 className="text-3xl font-bold">Sayfa Bulunamadı</h1>
      <Link to="/" className="underline">Ana sayfaya dön</Link>
    </div>
  );
}

export default NotFound;
