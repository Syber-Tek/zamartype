import '../index.css'
import logo from "../assets/icon.png";
const Logo = () => {
	return (
		<nav className="flex items-center justify-between p-4">
			{/* Logo and Title */}
			<div className="flex items-center justify-center space-x-5">
				<img src={logo} alt="App Logo" className="w-10 rounded-full" />
				<div>
					<a href="/" className="text-xl font-bold text-white">
						Zamar⚡Type
					</a>
				</div>
			</div>
		</nav>
	);
};

export default Logo;
