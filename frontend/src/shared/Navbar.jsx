import { Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user'))

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-primary/95 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <h1 className="text-xl font-bold text-white">
            Pay<span className="text-accent">Pact</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {user ? (
            <>
              {["Dashboard", "Contracts"].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(`/${item.toLowerCase()}`)}
                  className="relative text-sm font-medium text-white/75 transition hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
                >
                  {item}
                </button>
              ))}
            </>
          ) : (
            <>
              {["Features", "How it works"].map((item) => (
                <button
                  key={item}
                  className="relative text-sm font-medium text-white/75 transition hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all hover:after:w-full"
                >
                  {item}
                </button>
              ))}
            </>
          )}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          <button className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20">
            <Moon className="h-5 w-5 text-white" />
          </button>

          {user ? (
            <>
              <span className="text-sm text-white/75">{user.name}</span>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                className="rounded-xl bg-white px-6 text-primary hover:bg-slate-100"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </>
          )}

        </div>
      </div>
    </header>
  )
}