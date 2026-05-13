import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMenusContext } from './use-menus-context';

export function MenusPrimaryButtons() {
  const { setSelectedMenu, setIsFormOpen } = useMenusContext();

  const handleCreate = () => {
    setSelectedMenu(null);
    setIsFormOpen(true);
  };

  return (
    <Button onClick={handleCreate}>
      <Plus className='mr-2 h-4 w-4' />
      新建菜单
    </Button>
  );
}
