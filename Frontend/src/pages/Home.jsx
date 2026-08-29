import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page home">

      <span className="eyebrow">✨ Achievement Portfolio</span>

      <h1>Welcome to Proofolio 👋</h1>

      <p>
        Store, manage and showcase all your achievements
        in one place.
      </p>

      <div className="home-buttons">
        <Link to="/signup">
          <button>Get Started</button>
        </Link>

        <Link to="/dashboard">
          <button>View Dashboard</button>
        </Link>
      </div>

    </div>
  );
}

export default Home;