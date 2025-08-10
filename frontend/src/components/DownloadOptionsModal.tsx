import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Database } from 'lucide-react';

interface DownloadOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: DumpOptions) => void;
  databaseName: string;
}

interface DumpOptions {
  type: 'full' | 'schema' | 'data';
  schemaOnly?: boolean;
  dataOnly?: boolean;
}

export function DownloadOptionsModal({ isOpen, onClose, onConfirm, databaseName }: DownloadOptionsModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('full');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const options: DumpOptions = {
      type: selectedOption as 'full' | 'schema' | 'data',
      schemaOnly: selectedOption === 'schema',
      dataOnly: selectedOption === 'data',
    };
    onConfirm(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Download Database Dump
          </CardTitle>
          <CardDescription>
            Choose what to include in the dump for <strong>{databaseName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup 
            value={selectedOption} 
            onValueChange={setSelectedOption}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
              <RadioGroupItem value="full" id="full" />
              <Label htmlFor="full" className="cursor-pointer flex-1">
                <div className="font-medium">Full Dump (Schema + Data)</div>
                <div className="text-sm text-muted-foreground">
                  Complete backup with structure and all data
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
              <RadioGroupItem value="schema" id="schema" />
              <Label htmlFor="schema" className="cursor-pointer flex-1">
                <div className="font-medium">Schema Only</div>
                <div className="text-sm text-muted-foreground">
                  Database structure without data
                </div>
              </Label>
            </div>
            
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50">
              <RadioGroupItem value="data" id="data" />
              <Label htmlFor="data" className="cursor-pointer flex-1">
                <div className="font-medium">Data Only</div>
                <div className="text-sm text-muted-foreground">
                  Data without structure (INSERT statements)
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleConfirm} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
