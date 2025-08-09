import { useState } from 'react';
import { DatabaseInfo } from '../types';
import { Database, Search, Download } from 'lucide-react';
import { Button } from './ui/button';

interface DatabaseGridProps {
  databases: DatabaseInfo[];
  isLoading: boolean;
  onDownload: (dbName: string) => void;
  disabled?: boolean;
}

export const DatabaseGrid = ({ databases, isLoading, onDownload, disabled = false }: DatabaseGridProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDb, setSelectedDb] = useState<string | null>(null);

  const filteredDatabases = databases.filter(db =>
    db.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Databases</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-subtle rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Databases</h2>
          <span className="text-sm text-muted-foreground">
            ({filteredDatabases.length})
          </span>
        </div>

        {databases.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search databases..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 glass-subtle rounded-lg border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:outline-none transition-smooth"
            />
          </div>
        )}
      </div>

      {disabled ? (
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Select a Container</p>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a container to view available databases
          </p>
        </div>
      ) : databases.length === 0 ? (
        <div className="text-center py-8">
          <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No databases found</p>
          <p className="text-sm text-muted-foreground mt-1">
            No databases available for the selected container
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatabases.map((db) => (
            <div
              key={db.name}
              className={`glass-subtle rounded-lg p-4 hover:bg-secondary/10 transition-smooth cursor-pointer border ${
                selectedDb === db.name ? 'border-primary' : 'border-transparent'
              }`}
              onClick={() => setSelectedDb(selectedDb === db.name ? null : db.name)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground truncate">
                      {db.name}
                    </h3>
                  </div>
                  {db.size && (
                    <p className="text-sm text-muted-foreground">Size: {db.size}</p>
                  )}
                </div>
              </div>

              {selectedDb === db.name && (
                <div className="mt-4 pt-4 border-t border-glass-border">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(db.name);
                    }}
                    className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Dump
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {databases.length > 0 && filteredDatabases.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No databases match your search</p>
        </div>
      )}
    </div>
  );
};