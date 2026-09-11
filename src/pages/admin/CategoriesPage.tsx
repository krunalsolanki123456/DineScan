import { useEffect, useState } from 'react';
import { GripVertical, Plus, Pencil, Trash2, FolderTree } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createCategory, deleteCategory, getCategories, getMenuItems, updateCategory } from '@/lib/services';
import type { Category, MenuItem } from '@/types';
import { ConfirmModal, Modal, Toast } from '@/components/ui';
import { PageHeader, Toggle, inputClass, labelClass } from '@/components/admin/PageBits';
import { demoCategories, demoMenuItems } from '@/data/demo';

export default function CategoriesPage() {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name:'', icon:'🍽️', is_active:true });
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) return;
    (async () => {
      try {
        const [cats, menu] = await Promise.all([getCategories(restaurant.id), getMenuItems(restaurant.id)]);
        setCategories(cats);
        setItems(menu);
      } catch {
        setCategories(demoCategories.map((x)=>({...x,restaurant_id:restaurant.id})));
        setItems(demoMenuItems.map((x)=>({...x,restaurant_id:restaurant.id})));
      }
    })();
  }, [restaurant?.id]);

  const openNew = () => { setEditing(null); setForm({name:'',icon:'🍽️',is_active:true}); setModalOpen(true); };
  const openEdit = (cat:Category) => { setEditing(cat); setForm({name:cat.name,icon:cat.icon || '🍽️',is_active:cat.is_active}); setModalOpen(true); };

  const save = async () => {
    if (!restaurant || !form.name.trim()) return;
    try {
      if (editing) {
        const next = await updateCategory(editing.id, { name:form.name.trim(), icon:form.icon, is_active:form.is_active });
        if (next) setCategories((p)=>p.map((x)=>x.id===editing.id?next:x));
      } else {
        const created = await createCategory({ restaurant_id:restaurant.id, name:form.name.trim(), icon:form.icon, is_active:form.is_active, display_order:categories.length+1 });
        if (created) setCategories((p)=>[...p,created]);
      }
      setModalOpen(false); setToast(editing?'Category updated':'Category created');
    } catch { setToast('Could not save category'); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      setCategories((p)=>p.filter((x)=>x.id!==deleteTarget.id));
      setToast('Category deleted');
    } catch { setToast('Could not delete category'); }
  };

  const reorder = async (targetId:string) => {
    if (!dragged || dragged===targetId) return;
    const current = [...categories];
    const from = current.findIndex((x)=>x.id===dragged);
    const to = current.findIndex((x)=>x.id===targetId);
    if (from<0 || to<0) return;
    const [moved] = current.splice(from,1); current.splice(to,0,moved);
    const reordered = current.map((c,i)=>({...c,display_order:i+1}));
    setCategories(reordered); setDragged(null);
    try { await Promise.all(reordered.map((c)=>updateCategory(c.id,{display_order:c.display_order}))); } catch { /* keep optimistic */ }
  };

  const toggleActive = async (cat:Category) => {
    const next=!cat.is_active; setCategories((p)=>p.map((x)=>x.id===cat.id?{...x,is_active:next}:x));
    try { await updateCategory(cat.id,{is_active:next}); } catch {}
  };

  return <div className="space-y-6">
    <PageHeader title="Categories" description="Organize your digital menu and drag to change display order." actions={<button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"><Plus size={17}/> Add Category</button>} />

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[44px_1fr_120px_140px_90px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span></span><span>Category</span><span>Items</span><span>Status</span><span>Actions</span>
      </div>
      <div className="divide-y divide-slate-100">
        {categories.map((cat)=><div key={cat.id} draggable onDragStart={()=>setDragged(cat.id)} onDragOver={(e)=>e.preventDefault()} onDrop={()=>void reorder(cat.id)} className="grid grid-cols-[44px_1fr_120px_140px_90px] items-center px-4 py-4 transition hover:bg-slate-50">
          <button className="cursor-grab text-slate-300 active:cursor-grabbing"><GripVertical size={20}/></button>
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-xl">{cat.icon || '🍽️'}</div><div><p className="font-semibold text-slate-900">{cat.name}</p><p className="text-xs text-slate-400">Display order {cat.display_order}</p></div></div>
          <span className="text-sm text-slate-600">{items.filter((x)=>x.category_id===cat.id).length} items</span>
          <Toggle checked={cat.is_active} onChange={()=>void toggleActive(cat)} label={cat.is_active?'Active':'Hidden'} />
          <div className="flex gap-1"><button onClick={()=>openEdit(cat)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil size={16}/></button><button onClick={()=>setDeleteTarget(cat)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16}/></button></div>
        </div>)}
        {!categories.length && <div className="p-12 text-center"><FolderTree size={36} className="mx-auto text-slate-300"/><p className="mt-3 font-medium text-slate-700">No categories yet</p></div>}
      </div>
    </div>

    <Modal isOpen={modalOpen} onClose={()=>setModalOpen(false)} title={editing?'Edit Category':'Add Category'}>
      <div className="space-y-4 p-6"><div><label className={labelClass}>Category name</label><input className={inputClass} value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Main Course"/></div><div><label className={labelClass}>Icon / emoji</label><input className={inputClass} value={form.icon} onChange={(e)=>setForm({...form,icon:e.target.value})} placeholder="🍛"/></div><Toggle checked={form.is_active} onChange={(v)=>setForm({...form,is_active:v})} label="Visible on customer menu"/><div className="flex justify-end gap-2 pt-2"><button onClick={()=>setModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">Cancel</button><button onClick={()=>void save()} className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Save Category</button></div></div>
    </Modal>
    <ConfirmModal isOpen={!!deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={()=>void remove()} title="Delete category?" message="Menu items in this category will become uncategorized." confirmLabel="Delete" danger />
    {toast && <Toast message={toast} type={toast.startsWith('Could')?'error':'success'} onClose={()=>setToast(null)}/>} 
  </div>;
}
