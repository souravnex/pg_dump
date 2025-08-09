import { Database, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export const Header = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you'd update the theme context/localStorage
  };

  return (
    <header className="glass rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg glow">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">
              PostgreSQL Dump Manager
            </h1>
            <p className="text-muted-foreground text-sm">
              Export and manage your database dumps
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleDarkMode}
          className="p-2 glass-subtle rounded-lg hover:bg-secondary/20 transition-smooth"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
      </div>
    </header>
  );
};