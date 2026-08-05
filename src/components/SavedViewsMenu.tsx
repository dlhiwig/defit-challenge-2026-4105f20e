import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bookmark, BookmarkPlus, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  addSavedView, describeView, loadSavedViews, removeSavedView, type SavedView,
} from '@/lib/savedViews';

interface SavedViewsMenuProps {
  /** Storage scope, e.g. "leaderboard" or "rankings". */
  scope: string;
  /** Path to navigate to when applying a saved view. */
  basePath: string;
  /** Maps URL params to friendly text for the saved-view subtitle. */
  labels: Record<string, (value: string) => string>;
}

export default function SavedViewsMenu({ scope, basePath, labels }: SavedViewsMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [views, setViews] = useState<SavedView[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    setViews(loadSavedViews(scope));
  }, [scope]);

  const currentSearch = location.search.replace(/^\?/, '');

  const save = useCallback(() => {
    const label = name.trim() || describeView(currentSearch, labels);
    setViews(addSavedView(scope, label, currentSearch));
    setName('');
    setOpen(false);
    toast({
      title: 'View saved',
      description: `“${label}” is now in your saved views for this page.`,
    });
  }, [name, currentSearch, labels, scope, toast]);

  const apply = (view: SavedView) => {
    navigate(view.search ? `${basePath}?${view.search}` : basePath);
    toast({ title: 'View applied', description: `Restored “${view.name}”.` });
  };

  const remove = (view: SavedView) => {
    setViews(removeSavedView(scope, view.id));
    toast({ title: 'View removed', description: `“${view.name}” was deleted.` });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Saved views">
          <Bookmark className="w-4 h-4 mr-2" />
          Save this view
          {views.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">({views.length})</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 bg-card border-border">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Saves your current filters, sort, dataset, page size, and page.
        </DropdownMenuLabel>
        <div
          className="flex items-center gap-2 px-2 pb-2"
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                save();
              }
            }}
            placeholder={describeView(currentSearch, labels)}
            aria-label="Name for this saved view"
            className="h-8 bg-secondary/50 border-border text-sm"
          />
          <Button size="sm" className="h-8 shrink-0" onClick={save}>
            <BookmarkPlus className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>

        <DropdownMenuSeparator />

        {views.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">
            No saved views yet. Set up the table how you like it, then save it here.
          </p>
        ) : (
          views.map((view) => {
            const isCurrent = view.search === currentSearch;
            return (
              <DropdownMenuItem
                key={view.id}
                onSelect={(e) => {
                  e.preventDefault();
                  apply(view);
                  setOpen(false);
                }}
                className="flex items-start gap-2 cursor-pointer"
              >
                {isCurrent ? (
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Bookmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium truncate">{view.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {describeView(view.search, labels)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Delete saved view ${view.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(view);
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
