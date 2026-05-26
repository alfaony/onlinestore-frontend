export default function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars">
      {'★'.repeat(Math.floor(rating))}
      {'☆'.repeat(5 - Math.floor(rating))}
    </span>
  )
}
