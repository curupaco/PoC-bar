
import React, { useState, useMemo, useEffect } from 'react';
import { Product, formatCurrency, User, ModifierGroup, ModifierOption, parseCurrencyValue, sanitizeCurrencyInput, generateUniqueId, SellType, Tab, Category, RecipeItem } from '../../types';
import { validateItemName } from '../../utils/wordValidator';
import ProductItemsTab from './components/ProductItemsTab';
import ModifierGroupsTab from './components/ModifierGroupsTab';
import CategoryLinksTab from './components/CategoryLinksTab';
import CategoriesTab from './components/CategoriesTab';
import ModifierGroupModal from './components/ModifierGroupModal';
import { Tabs, ConfirmationModal } from '../../shared/ui';

interface ProductListProps {
  products: Product[];
  setProducts: (updater: (prev: Product[]) => Product[]) => void;
  modifierGroups: ModifierGroup[];
  setModifierGroups: (updater: (prev: ModifierGroup[]) => ModifierGroup[]) => void;
  categoryModifiers: Record<string, string>;
  setCategoryModifiers: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  openTabs: Tab[];
  onSaveTab: (tab: Tab) => void;
  categories?: Category[];
  setCategories?: (updater: (prev: Category[]) => Category[]) => void;
  currentUser: User;
  drinksEnabled?: boolean;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products = [], 
  setProducts,
  modifierGroups = [], 
  setModifierGroups, 
  categoryModifiers = {},
  setCategoryModifiers,
  openTabs,
  onSaveTab,
  categories = [],
  setCategories,
  currentUser,
  drinksEnabled = true
}) => {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'GROUPS' | 'LINKS' | 'CATEGORIES_MANAGE'>('ITEMS');
  const [showModal, setShowModal] = useState(false);
  
  // UX-01: Estado para feedback visual (Toast)
  const [toast, setToast] = useState<string | null>(null);

  // States para Grupos de Modificadores
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ModifierGroup | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<{id: string, name: string, type: 'prod' | 'mod'} | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(''); 
  const [sellType, setSellType] = useState<SellType>('unit');
  const [modGroupId, setModGroupId] = useState<string>('');
  const [trackStock, setTrackStock] = useState(true);
  const [cost, setCost] = useState('');
  const [toKitchen, setToKitchen] = useState(false);
  const [isRawMaterial, setIsRawMaterial] = useState(false);
  const [unitLabel, setUnitLabel] = useState('');
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [tempIngId, setTempIngId] = useState('');
  const [tempIngQty, setTempIngQty] = useState('');
  
  // Happy Hour
  const [hhPrice, setHhPrice] = useState('');
  const [hhStart, setHhStart] = useState('');
  const [hhEnd, setHhEnd] = useState('');

  // Embalagem & Insumos Fracionados (Drinks Module)
  const [packageVolume, setPackageVolume] = useState('');
  const [packageUnit, setPackageUnit] = useState('ml');
  const [packageCostPrice, setPackageCostPrice] = useState('');
  const [isSubRecipe, setIsSubRecipe] = useState(false);
  const [yieldQuantity, setYieldQuantity] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState('7');

  const canEdit = currentUser.username === 'admin' || currentUser.permissions.includes('edit_product');
  const canDelete = currentUser.username === 'admin' || currentUser.permissions.includes('delete_product');

  // Cálculo ao vivo de CMV e Margem da Ficha Técnica
  const currentRecipeCost = useMemo(() => {
    if (!recipe || recipe.length === 0) return 0;
    return recipe.reduce((sum, item) => {
      const ing = products.find(p => p.id === item.productId);
      return sum + ((ing?.lastCostPrice || 0) * item.quantity);
    }, 0);
  }, [recipe, products]);

  const currentPriceNumeric = useMemo(() => parseCurrencyValue(price) || 0, [price]);
  const currentCmvPercent = currentPriceNumeric > 0 ? (currentRecipeCost / currentPriceNumeric) * 100 : 0;
  const currentGrossProfit = currentPriceNumeric - currentRecipeCost;
  const currentGrossMargin = currentPriceNumeric > 0 ? (currentGrossProfit / currentPriceNumeric) * 100 : 0;

  // Limpa o toast automaticamente
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 6000); // B1: Aumentado para 6s
      return () => clearTimeout(t);
    }
  }, [toast]);

  const showFeedback = (msg: string) => setToast(msg);

  const handleSaveProduct = () => {
    setError(null);
    const numericPrice = parseCurrencyValue(price);
    const numericHhPrice = parseCurrencyValue(hhPrice);
    const finalName = name.toUpperCase().trim();
    const finalCategory = category.toUpperCase().trim() || 'GERAL';

    const nameError = validateItemName(finalName);
    if (nameError) { setError(nameError); return; }

    const categoryError = validateItemName(finalCategory);
    if (categoryError && finalCategory !== 'GERAL') { setError(`Categoria inválida: ${categoryError}`); return; }

    if (!finalName) { setError("Nome é obrigatório."); return; }
    if (isNaN(numericPrice) || numericPrice < 0) { setError("Preço inválido."); return; }
    
    // D1: Impedir preço zero
    if (numericPrice === 0) { setError("O preço deve ser maior que zero."); return; }

    // D3: Verificação de duplicidade de nome
    const isDuplicate = products.some(p => p.id !== editingId && p.name.toUpperCase().trim() === finalName);
    if (isDuplicate) { setError("Já existe um produto com este nome."); return; }

    const parsedPkgVol = parseFloat(packageVolume.replace(',', '.'));
    const parsedPkgCost = parseCurrencyValue(packageCostPrice);
    const parsedYield = parseFloat(yieldQuantity.replace(',', '.'));
    const parsedShelf = parseInt(shelfLifeDays, 10);

    // Se tiver receita definida, o custo do produto pode herdar a soma dos insumos
    const effectiveCost = (currentRecipeCost > 0 && !isRawMaterial) 
      ? currentRecipeCost 
      : (parseCurrencyValue(cost) || undefined);

    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? {
        ...p,
        name: finalName,
        price: numericPrice,
        category: finalCategory,
        sellType,
        modifierGroupId: modGroupId || undefined,
        trackStock: (recipe.length > 0 && !isRawMaterial) ? false : trackStock,
        lastCostPrice: effectiveCost,
        happyHourPrice: numericHhPrice > 0 ? numericHhPrice : undefined,
        happyHourStart: hhStart || undefined,
        happyHourEnd: hhEnd || undefined,
        toKitchen,
        isRawMaterial,
        unitLabel: unitLabel.trim() || undefined,
        packageVolume: !isNaN(parsedPkgVol) && parsedPkgVol > 0 ? parsedPkgVol : undefined,
        packageUnit: packageUnit || undefined,
        packageCostPrice: parsedPkgCost > 0 ? parsedPkgCost : undefined,
        isSubRecipe: isRawMaterial ? isSubRecipe : undefined,
        yieldQuantity: !isNaN(parsedYield) && parsedYield > 0 ? parsedYield : undefined,
        shelfLifeDays: !isNaN(parsedShelf) && parsedShelf > 0 ? parsedShelf : undefined,
        recipe: (isRawMaterial && !isSubRecipe) ? undefined : recipe
      } : p));
      showFeedback("PRODUTO ATUALIZADO!");
    } else {
      const newProduct: Product = {
        id: generateUniqueId('prod'),
        name: finalName,
        price: numericPrice,
        category: finalCategory,
        sellType,
        isFavorite: false,
        modifierGroupId: modGroupId || undefined,
        trackStock: (recipe.length > 0 && !isRawMaterial) ? false : trackStock,
        lastCostPrice: effectiveCost,
        happyHourPrice: numericHhPrice > 0 ? numericHhPrice : undefined,
        happyHourStart: hhStart || undefined,
        happyHourEnd: hhEnd || undefined,
        toKitchen,
        isRawMaterial,
        unitLabel: unitLabel.trim() || undefined,
        packageVolume: !isNaN(parsedPkgVol) && parsedPkgVol > 0 ? parsedPkgVol : undefined,
        packageUnit: packageUnit || undefined,
        packageCostPrice: parsedPkgCost > 0 ? parsedPkgCost : undefined,
        isSubRecipe: isRawMaterial ? isSubRecipe : undefined,
        yieldQuantity: !isNaN(parsedYield) && parsedYield > 0 ? parsedYield : undefined,
        shelfLifeDays: !isNaN(parsedShelf) && parsedShelf > 0 ? parsedShelf : undefined,
        recipe: (isRawMaterial && !isSubRecipe) ? undefined : recipe
      };
      setProducts(prev => [...prev, newProduct]);
      showFeedback("PRODUTO CADASTRADO!");
    }

    // CORREÇÃO: Criação segura de categoria com verificação atômica dentro do updater
    // Isso previne que salvamentos rápidos criem categorias duplicadas por race condition
    if (setCategories) {
        setCategories(prev => {
            const exists = prev.some(c => c.name.toUpperCase().trim() === finalCategory);
            if (exists) return prev;
            return [...prev, { id: generateUniqueId('cat'), name: finalCategory }];
        });
    }

    closeModal();
  };

  const handleSaveGroup = (group: ModifierGroup) => {
    setModifierGroups(prev => {
      const exists = prev.some(g => g.id === group.id);
      if (exists) {
        return prev.map(g => g.id === group.id ? group : g);
      } else {
        return [...prev, group];
      }
    });
    showFeedback("MENU DE OPÇÕES SALVO!");
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const openEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toFixed(2).replace('.', ','));
    setCategory(p.category);
    setSellType(p.sellType);
    setModGroupId(p.modifierGroupId || '');
    setTrackStock(p.trackStock ?? true);
    setCost(p.lastCostPrice ? p.lastCostPrice.toFixed(2).replace('.', ',') : '');
    setHhPrice(p.happyHourPrice ? p.happyHourPrice.toFixed(2).replace('.', ',') : '');
    setHhStart(p.happyHourStart || '');
    setHhEnd(p.happyHourEnd || '');
    setToKitchen(p.toKitchen ?? false);
    setIsRawMaterial(p.isRawMaterial ?? false);
    setUnitLabel(p.unitLabel || '');
    setPackageVolume(p.packageVolume ? String(p.packageVolume) : '');
    setPackageUnit(p.packageUnit || 'ml');
    setPackageCostPrice(p.packageCostPrice ? p.packageCostPrice.toFixed(2).replace('.', ',') : '');
    setIsSubRecipe(p.isSubRecipe ?? false);
    setYieldQuantity(p.yieldQuantity ? String(p.yieldQuantity) : '');
    setShelfLifeDays(p.shelfLifeDays ? String(p.shelfLifeDays) : '7');
    setRecipe(p.recipe || []);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setSellType('unit');
    setModGroupId('');
    setTrackStock(true);
    setCost('');
    setHhPrice('');
    setHhStart('');
    setHhEnd('');
    setToKitchen(false);
    setIsRawMaterial(false);
    setUnitLabel('');
    setPackageVolume('');
    setPackageUnit('ml');
    setPackageCostPrice('');
    setIsSubRecipe(false);
    setYieldQuantity('');
    setShelfLifeDays('7');
    setRecipe([]);
    setTempIngId('');
    setTempIngQty('');
    setError(null);
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    if (deleteConfirmId.type === 'prod') {
      setProducts(prev => prev.filter(p => p.id !== deleteConfirmId.id));
      showFeedback("ITEM REMOVIDO");
    } else {
      setModifierGroups(prev => prev.filter(g => g.id !== deleteConfirmId.id));
      showFeedback("GRUPO REMOVIDO");
    }
    setDeleteConfirmId(null);
  };

  // Safe category list including distinct categories from products if missing in official list
  // CORREÇÃO: Normalização estrita (trim + upper) para evitar duplicatas visuais (ex: "BEBIDAS" vs "BEBIDAS ")
  const allCategories = useMemo(() => {
     const catNames = new Set<string>();
     
     // 1. Normaliza categorias oficiais
     categories.forEach(c => {
         if (c.name) catNames.add(c.name.trim().toUpperCase());
     });

     // 2. Normaliza categorias vindas dos produtos (para capturar órfãs)
     products.forEach(p => { 
         if(p.category) catNames.add(p.category.trim().toUpperCase()); 
     });
     
     return Array.from(catNames).sort();
  }, [categories, products]);

  return (
    <div className="max-w-7xl mx-auto pb-32 relative">
      {/* TOAST NOTIFICATION (UX-01) */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1200] animate-in slide-in-from-top-4 fade-in">
           <div className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 border border-emerald-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {toast}
           </div>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="mb-8">
        <Tabs 
          items={[
            { id: 'ITEMS', label: 'Produtos' },
            { id: 'GROUPS', label: 'Adicionais' },
            { id: 'LINKS', label: 'Vínculos' },
            ...(setCategories ? [{ id: 'CATEGORIES_MANAGE', label: 'Categorias' }] : [])
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />
      </div>

      {activeTab === 'ITEMS' && (
        <ProductItemsTab 
          products={products}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          collapsedCats={collapsedCats}
          toggleCategory={toggleCategory}
          setProducts={setProducts}
          onEdit={openEditProduct}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'prod'})}
          onShowModal={() => setShowModal(true)}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      )}

      {activeTab === 'GROUPS' && (
        <ModifierGroupsTab 
          modifierGroups={modifierGroups}
          onEdit={(g) => { setEditingGroup(g); setShowGroupModal(true); }}
          onDelete={(id, name) => setDeleteConfirmId({id, name, type: 'mod'})}
          onShowModal={() => { setEditingGroup(null); setShowGroupModal(true); }}
        />
      )}

      {activeTab === 'LINKS' && (
        <CategoryLinksTab 
          categories={allCategories}
          categoryModifiers={categoryModifiers}
          modifierGroups={modifierGroups}
          setCategoryModifiers={setCategoryModifiers}
        />
      )}

      {activeTab === 'CATEGORIES_MANAGE' && categories && setCategories && (
        <CategoriesTab 
          categories={categories}
          setCategories={setCategories}
          products={products}
          setProducts={setProducts}
        />
      )}

      {/* MODAL DE GRUPO DE MODIFICADORES */}
      <ModifierGroupModal 
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSave={handleSaveGroup}
        initialData={editingGroup}
      />

      {/* MODAL DE PRODUTO */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in" onClick={closeModal} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl md:rounded-[36px] p-5 sm:p-7 md:p-8 shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center mb-6 sm:mb-8 shrink-0">
              <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                {editingId ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={closeModal} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all font-bold text-sm" aria-label="Fechar modal de produto">✕</button>
            </div>

            <div className="space-y-6 overflow-y-auto no-scrollbar p-1">
              <div className="space-y-2">
                <label htmlFor="product-name-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                <input 
                  id="product-name-input"
                  autoFocus
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-sm uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  placeholder="EX: HEINEKEN 600ML" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="product-price-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Venda</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs sm:text-sm">R$</span>
                    <input 
                      id="product-price-input"
                      type="text" 
                      inputMode="decimal"
                      value={price} 
                      onChange={e => setPrice(sanitizeCurrencyInput(e.target.value))} 
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-base sm:text-lg outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                      placeholder="0,00" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="product-cost-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custo (CMV)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs sm:text-sm">R$</span>
                    <input 
                      id="product-cost-input"
                      type="text" 
                      inputMode="decimal"
                      value={cost} 
                      onChange={e => setCost(sanitizeCurrencyInput(e.target.value))} 
                      className="w-full pl-12 pr-4 py-3.5 sm:py-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                      placeholder="0,00" 
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-4">
                 <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
                   <span>🔥</span> Happy Hour Automático (Opcional)
                 </h4>
                 <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Preço Promocional</label>
                      <input type="text" value={hhPrice} onChange={e => setHhPrice(sanitizeCurrencyInput(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-amber-500" placeholder="0,00" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Início (Ex: 18:00)</label>
                      <input type="time" value={hhStart} onChange={e => setHhStart(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Fim (Ex: 20:00)</label>
                      <input type="time" value={hhEnd} onChange={e => setHhEnd(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-amber-500" />
                    </div>
                 </div>
              </div>

              {/* TIPO DE PRODUTO & INSUMO */}
              <div className="pt-2">
                <button 
                  onClick={() => setIsRawMaterial(!isRawMaterial)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isRawMaterial ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-950'}`}
                  type="button"
                >
                  <div className="flex flex-col items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isRawMaterial ? 'text-indigo-600' : 'text-slate-400'}`}>Apenas Insumo / Matéria-prima</span>
                    <span className="text-[9px] font-bold text-slate-400">Não aparece no cardápio de vendas do PDV</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isRawMaterial ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isRawMaterial ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {/* MÓDULO DE DRINKS: CONVERSÃO DE EMBALAGEM / VOLUME DO INSUMO */}
              {isRawMaterial && drinksEnabled && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-widest flex items-center gap-2">
                      <span>📦</span> Embalagem de Compra & Fracionamento
                    </h4>
                    <span className="text-[8px] font-black uppercase bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">Auto-Cálculo</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Preço Embalagem (R$)</label>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="Ex: 85,00"
                        value={packageCostPrice} 
                        onChange={e => {
                          const val = sanitizeCurrencyInput(e.target.value);
                          setPackageCostPrice(val);
                          const numPkgCost = parseCurrencyValue(val);
                          const numVol = parseFloat(packageVolume.replace(',', '.'));
                          if (numPkgCost > 0 && numVol > 0) {
                            const unitCost = (numPkgCost / numVol).toFixed(4).replace('.', ',');
                            setCost(unitCost);
                          }
                        }} 
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Volume / Conteúdo</label>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="Ex: 750"
                        value={packageVolume} 
                        onChange={e => {
                          const val = sanitizeCurrencyInput(e.target.value);
                          setPackageVolume(val);
                          const numVol = parseFloat(val.replace(',', '.'));
                          const numPkgCost = parseCurrencyValue(packageCostPrice);
                          if (numPkgCost > 0 && numVol > 0) {
                            const unitCost = (numPkgCost / numVol).toFixed(4).replace('.', ',');
                            setCost(unitCost);
                          }
                        }} 
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-500 uppercase">Unidade Medida</label>
                      <select 
                        value={packageUnit} 
                        onChange={e => {
                          setPackageUnit(e.target.value);
                          setUnitLabel(e.target.value);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-black outline-none focus:border-indigo-500 uppercase"
                      >
                        <option value="ml">ML (Mililitros)</option>
                        <option value="g">G (Gramas)</option>
                        <option value="un">UN (Unidade / Fatia)</option>
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const numPkgCost = parseCurrencyValue(packageCostPrice);
                    const numVol = parseFloat(packageVolume.replace(',', '.'));
                    if (numPkgCost > 0 && numVol > 0) {
                      const costPerUnit = numPkgCost / numVol;
                      const doseCost = costPerUnit * 50;
                      return (
                        <p className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-slate-900/70 p-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
                          <span>📊 Custo Fracionado: <strong>R$ {costPerUnit.toFixed(4)} / {packageUnit}</strong></span>
                          {packageUnit === 'ml' && (
                            <span className="text-emerald-600 dark:text-emerald-400">Dose (50ml): <strong>R$ {doseCost.toFixed(2)}</strong></span>
                          )}
                        </p>
                      );
                    }
                    return null;
                  })()}

                  {/* Toggle de Sub-preparo / Batch */}
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/30">
                    <button 
                      type="button"
                      onClick={() => setIsSubRecipe(!isSubRecipe)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSubRecipe ? 'bg-purple-100/50 border-purple-300 dark:bg-purple-900/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}
                    >
                      <div className="text-left">
                        <p className="text-[9px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">É um Sub-preparo / Batch Artesanal? (Xarope, Infusão, Premix)</p>
                        <p className="text-[8px] text-slate-400">Permite registrar receita própria e gerar ordens de produção com validade</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${isSubRecipe ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isSubRecipe ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </button>

                    {isSubRecipe && (
                      <div className="grid grid-cols-2 gap-3 mt-3 animate-in fade-in">
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Rendimento Padrão do Lote</label>
                          <input 
                            type="text" 
                            placeholder="Ex: 1000"
                            value={yieldQuantity}
                            onChange={e => setYieldQuantity(sanitizeCurrencyInput(e.target.value))}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-xs font-black outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-bold text-slate-500 uppercase">Validade Refrigerada (Dias)</label>
                          <input 
                            type="number" 
                            min="1"
                            max="365"
                            placeholder="Ex: 7"
                            value={shelfLifeDays}
                            onChange={e => setShelfLifeDays(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-800 text-xs font-black outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RENDERIZADOR DE UNIDADE DE MEDIDA PERSONALIZADA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Venda/Estoque por</label>
                  <div className="flex p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button type="button" onClick={() => setSellType('unit')} className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${sellType === 'unit' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>UN</button>
                    <button type="button" onClick={() => setSellType('weight')} className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${sellType === 'weight' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}>KG</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="product-unit-label" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla Unidade (Ex: ml, g, dose)</label>
                  <input 
                    id="product-unit-label"
                    type="text" 
                    value={unitLabel} 
                    onChange={e => setUnitLabel(e.target.value)} 
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                    placeholder="EX: ML" 
                  />
                </div>
              </div>

              {/* FICHA TÉCNICA (Disponível para Drinks finais OU Sub-preparos) */}
              {((!isRawMaterial && drinksEnabled) || (isRawMaterial && isSubRecipe && drinksEnabled)) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                      <span>🍸</span> Ficha Técnica ({isSubRecipe ? 'Ingredientes do Lote' : 'Ingredientes do Drink'})
                    </h4>
                    {currentRecipeCost > 0 && (
                      <span className="text-[9px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                        Custo: {formatCurrency(currentRecipeCost)}
                      </span>
                    )}
                  </div>
                  
                  {recipe.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar pr-1">
                      {recipe.map((rItem, idx) => {
                        const ing = products.find(p => p.id === rItem.productId);
                        const ingTotalCost = (ing?.lastCostPrice || 0) * rItem.quantity;
                        return (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase">
                            <div className="flex flex-col">
                              <span className="text-slate-800 dark:text-white flex items-center gap-1.5">
                                {ing?.isSubRecipe && <span className="text-[8px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 px-1 py-0.2 rounded font-black">BATCH</span>}
                                {ing?.name || 'Item Desconhecido'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-normal">Custo: {formatCurrency(ingTotalCost)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-600 font-black">{rItem.quantity} {ing?.unitLabel || 'un'}</span>
                              <button 
                                onClick={() => setRecipe(prev => prev.filter((_, i) => i !== idx))}
                                className="text-red-500 hover:text-red-700 font-bold p-1"
                                type="button"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[9px] font-bold text-slate-400 uppercase text-center py-2">Sem ingredientes cadastrados na receita</p>
                  )}

                  <div className="flex gap-2">
                    <select
                      value={tempIngId}
                      onChange={e => setTempIngId(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold text-[10px] uppercase outline-none"
                    >
                      <option value="">Selecionar Insumo / Sub-preparo...</option>
                      {products
                        .filter(p => (p.isRawMaterial || p.isSubRecipe) && p.id !== editingId && !recipe.some(r => r.productId === p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.isSubRecipe ? '🧪 [BATCH] ' : ''}{p.name} {p.unitLabel ? `(${p.unitLabel})` : ''} {p.lastCostPrice ? `• R$ ${p.lastCostPrice.toFixed(2)}` : ''}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Qtd"
                      value={tempIngQty}
                      onChange={e => setTempIngQty(sanitizeCurrencyInput(e.target.value))}
                      className="w-16 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-black text-xs text-center outline-none"
                    />
                    <button
                      onClick={() => {
                        const qtyVal = parseFloat(tempIngQty.replace(',', '.'));
                        if (!tempIngId) { alert('Selecione um insumo'); return; }
                        if (isNaN(qtyVal) || qtyVal <= 0) { alert('Qtd inválida'); return; }
                        setRecipe(prev => [...prev, { productId: tempIngId, quantity: qtyVal }]);
                        setTempIngId('');
                        setTempIngQty('');
                      }}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-[10px] active:scale-95 transition-all"
                      type="button"
                    >
                      +
                    </button>
                  </div>

                  {/* WIDGET FINANCEIRO: CMV & SIMULADOR DE MARGEM ALVO (Apenas para Drinks Finais) */}
                  {!isRawMaterial && currentRecipeCost > 0 && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">CMV (%)</p>
                          <p className={`text-sm font-black ${currentCmvPercent <= 30 ? 'text-emerald-600' : currentCmvPercent <= 45 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {currentCmvPercent.toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Lucro Bruto</p>
                          <p className={`text-sm font-black ${currentGrossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(currentGrossProfit)}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Margem Bruta</p>
                          <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                            {currentGrossMargin.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Atalhos de Precificação Alvo */}
                      <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-[8px] font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider mb-1.5 flex items-center justify-between">
                          <span>💡 Sugestão de Preço por Margem Alvo:</span>
                          <span className="text-[7px] text-slate-400">(Clique para aplicar)</span>
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { label: '60% Margem', divisor: 0.40 },
                            { label: '70% Margem', divisor: 0.30 },
                            { label: '80% Margem', divisor: 0.20 }
                          ].map(sug => {
                            const sugPrice = (currentRecipeCost / sug.divisor);
                            return (
                              <button
                                key={sug.label}
                                type="button"
                                onClick={() => setPrice(sugPrice.toFixed(2).replace('.', ','))}
                                className="px-2 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 dark:border-indigo-800 text-[9px] font-black text-slate-700 dark:text-slate-200 transition-all flex flex-col items-center"
                              >
                                <span className="text-[7px] opacity-70">{sug.label}</span>
                                <span>{formatCurrency(sugPrice)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            <div className="space-y-2">
                <label htmlFor="product-category-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {allCategories.slice(0, 5).map(c => (
                    <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${category === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-400'}`}>
                      {c}
                    </button>
                  ))}
                </div>
                <input 
                  id="product-category-input"
                  type="text" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-black text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all" 
                  placeholder="DIGITE OU SELECIONE..." 
                  list="cat-suggestions"
                />
                <datalist id="cat-suggestions">
                  {allCategories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div className="space-y-2">
                <label htmlFor="product-modifiers-select" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Menu de Adicionais (Opcional)</label>
                <select 
                  id="product-modifiers-select"
                  value={modGroupId} 
                  onChange={e => setModGroupId(e.target.value)} 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-xs uppercase outline-none focus:ring-2 focus:ring-red-500 transition-all"
                >
                  <option value="">Sem adicionais</option>
                  {modifierGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setTrackStock(!trackStock)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${trackStock ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-950'}`}
                >
                  <div className="flex flex-col items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${trackStock ? 'text-indigo-600' : 'text-slate-400'}`}>Controlar Estoque</span>
                    <span className="text-[9px] font-bold text-slate-400">Habilitar baixa automática e saldo</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${trackStock ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${trackStock ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button 
                  onClick={() => setToKitchen(!toKitchen)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${toKitchen ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : 'bg-slate-50 border-slate-200 dark:bg-slate-950'}`}
                >
                  <div className="flex flex-col items-start">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${toKitchen ? 'text-red-600' : 'text-slate-400'}`}>Enviar para a Cozinha</span>
                    <span className="text-[9px] font-bold text-slate-400">Exibir no monitor de produção da cozinha</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${toKitchen ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-800'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${toKitchen ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                  <p className="text-center text-[10px] font-black text-red-500 uppercase">{error}</p>
                </div>
              )}
            </div>

            <div className="pt-4 sm:pt-6 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
              <button 
                type="button" 
                onClick={closeModal} 
                className="w-1/3 py-3.5 sm:py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black uppercase text-xs tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleSaveProduct} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 sm:py-4 rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-red-600/20 active:scale-95 transition-all"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmId && (
        <ConfirmationModal
          isOpen={true}
          title="Excluir Item?"
          message={`Você está prestes a remover "${deleteConfirmId.name}" do cadastro.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirmId(null)}
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          isDanger
        />
      )}
    </div>
  );
};

export default ProductList;
