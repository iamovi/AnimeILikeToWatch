import { useRef } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, Download, Upload, Trash2, Sun, Moon, Monitor, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { StatsDialog } from './StatsDialog';
import { Anime } from '@/types/anime';

interface SettingsMenuProps {
  onExport: () => void;
  onImport: (file: File) => Promise<boolean>;
  onClearAll: () => void;
  animeCount: number;
  animes: Anime[];
}

export function SettingsMenu({ onExport, onImport, onClearAll, animeCount, animes }: SettingsMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    onExport();
    toast.success('Backup downloaded!', {
      description: 'Your anime list has been saved to a JSON file.',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await onImport(file);
      if (success) {
        toast.success('List restored!', {
          description: 'Your anime list has been imported successfully.',
        });
      } else {
        toast.error('Import failed', {
          description: 'The file could not be read. Make sure it\'s a valid backup file.',
        });
      }
      e.target.value = '';
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all anime from your list? This cannot be undone.')) {
      onClearAll();
      toast.success('List cleared', {
        description: 'All anime have been removed from your list.',
      });
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <StatsDialog
            animes={animes}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <BarChart3 className="w-4 h-4 mr-2" />
                View Statistics
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme('light')}>
            <Sun className="w-4 h-4 mr-2" />
            Light
            {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('dark')}>
            <Moon className="w-4 h-4 mr-2" />
            Dark
            {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme('system')}>
            <Monitor className="w-4 h-4 mr-2" />
            System
            {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExport} disabled={animeCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Backup
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleImportClick}>
            <Upload className="w-4 h-4 mr-2" />
            Import Backup
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleClearAll}
            disabled={animeCount === 0}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
