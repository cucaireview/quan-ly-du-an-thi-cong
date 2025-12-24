import React, { useState, useEffect } from 'react';
import { PCCCMaterial, PCCCCategory } from '../types';
import { ShieldAlert, Package, AlertTriangle, CheckCircle2, Search, Filter, BrainCircuit, ArrowUpRight, Calendar, AlertCircle, Plus, Edit, X, Save, Trash2, FileUp, Download, Minus, PlusCircle } from 'lucide-react';
import { analyzePCCCStock } from '../services/geminiService';

interface PCCCWarehouseProps {
  materials: PCCCMaterial[];
  onUpdateMaterial: (material: PCCCMaterial) => void;
  onAddMaterial: (material: PCCCMaterial) => void;
  onDeleteMaterial: (id: string) => void;
}

const emptyMaterial: PCCCMaterial = {
    id: '',
    name: '',
    category: 'Pipe',
    spec: '',
    totalQuantity: 0,
    availableQuantity: 0,
    minStockLevel: 0,
    unit: '',
    status: 'Good',
    allocatedTo: []
};

const PCCCWarehouse: React.FC<PCCCWarehouseProps> = ({ materials, onUpdateMaterial, onAddMaterial, onDeleteMaterial }) => {
  const [filterCategory, setFilterCategory] = useState<PCCCCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'analysis'>('inventory');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<PCCCMaterial | null>(null);
  const [formData, setFormData] = useState<PCCCMaterial>(emptyMaterial);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<PCCCMaterial[]>([]);
  const [importError, setImportError] = useState<string | null>(null);

  const categories: PCCCCategory[] = ['Pipe', 'Sprinkler', 'Valve', 'Cabinet', 'Alarm', 'Extinguisher'];

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = filterCategory === 'ALL' || m.category === filterCategory;
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.spec.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Stats
  const lowStockCount = materials.filter(m => m.availableQuantity <= m.minStockLevel).length;
  const expiredCount = materials.filter(m => m.inspectionExpiry && new Date(m.inspectionExpiry) < new Date()).length;
  const totalItems = materials.reduce((acc, curr) => acc + curr.totalQuantity, 0);

  const handleRunAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await analyzePCCCStock(materials);
      setAiAnalysis(result);
      setIsAnalyzing(false);
  };

  const isExpired = (dateString?: string) => {
      if (!dateString) return false;
      return new Date(dateString) < new Date();
  };

  // --- Quick Adjustment Handlers ---
  const adjustQuantity = (material: PCCCMaterial, amount: number) => {
      const newQty = Math.max(0, Math.min(material.totalQuantity, material.availableQuantity + amount));
      if (newQty === material.availableQuantity) return;

      let status: 'Good' | 'Low Stock' | 'Expired' = 'Good';
      if (material.inspectionExpiry && isExpired(material.inspectionExpiry)) {
          status = 'Expired';
      } else if (newQty <= material.minStockLevel) {
          status = 'Low Stock';
      }

      onUpdateMaterial({
          ...material,
          availableQuantity: newQty,
          status
      });
  };

  // --- Form Handlers ---
  const handleAddNew = () => {
      setEditingMaterial(null);
      setFormData({ ...emptyMaterial });
      setIsFormOpen(true);
  };

  const handleEdit = (material: PCCCMaterial) => {
      setEditingMaterial(material);
      setFormData({ ...material });
      setIsFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa vật tư "${name}" khỏi danh sách kho?`)) {
          onDeleteMaterial(id);
      }
  };

  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      
      let status: 'Good' | 'Low Stock' | 'Expired' = 'Good';
      if (formData.inspectionExpiry && isExpired(formData.inspectionExpiry)) {
          status = 'Expired';
      } else if (formData.availableQuantity <= formData.minStockLevel) {
          status = 'Low Stock';
      }

      const materialToSave = { ...formData, status };

      if (editingMaterial) {
          onUpdateMaterial(materialToSave);
      } else {
          onAddMaterial({ ...materialToSave, id: `pccc-${Date.now()}` });
      }
      setIsFormOpen(false);
  };

  const handleInputChange = (field: keyof PCCCMaterial, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Excel Import Logic ---
  const downloadTemplate = () => {
      // Define headers and an example row for the user
      const headers = ["Tên vật tư", "Danh mục", "Quy cách", "Đơn vị", "Tổng SL", "SL Khả dụng", "Mức tối thiểu", "Hạn kiểm định (YYYY-MM-DD)"];
      const exampleRows = [
          ["Đầu phun Sprinkler Quay xuống", "Sprinkler", "68 độ C, K=5.6, Tyco", "Cái", "1000", "800", "200", "2025-12-31"],
          ["Bình chữa cháy bột ABC", "Extinguisher", "MFZ4 4kg", "Bình", "200", "150", "50", "2024-06-15"],
          ["Ống thép đúc PCCC", "Pipe", "DN100 Sch40", "Mét", "500", "450", "100", ""]
      ];
      
      const csvContent = [
          headers.join(","),
          ...exampleRows.map(row => row.join(","))
      ].join("\n");

      // Use BOM for UTF-8 Excel support
      const BOM = "\uFEFF"; 
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "Mau_Nhap_Vat_Tu_PCCC.csv");
      link.click();
      URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          const lines = content.split(/\r?\n/);
          if (lines.length < 2) {
              setImportError("File không có dữ liệu hoặc sai định dạng.");
              return;
          }

          const result: PCCCMaterial[] = [];
          // Skip header
          for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue;
              
              // Basic CSV parsing (splitting by comma, handles simple cases)
              const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ''));
              
              if (values.length < 4) continue;

              const totalQty = parseInt(values[4]) || 0;
              const availQty = parseInt(values[5]) || 0;
              const minStock = parseInt(values[6]) || 0;
              const expiry = values[7] || undefined;

              const mat: PCCCMaterial = {
                  id: `pccc-import-${Date.now()}-${i}`,
                  name: values[0] || "Vật tư không tên",
                  category: (values[1] as PCCCCategory) || "Pipe",
                  spec: values[2] || "",
                  unit: values[3] || "Cái",
                  totalQuantity: totalQty,
                  availableQuantity: availQty,
                  minStockLevel: minStock,
                  inspectionExpiry: expiry,
                  status: 'Good',
                  allocatedTo: []
              };
              
              // Status calc
              if (expiry && isExpired(expiry)) mat.status = 'Expired';
              else if (availQty <= minStock) mat.status = 'Low Stock';

              result.push(mat);
          }

          if (result.length === 0) {
              setImportError("Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng sử dụng file mẫu.");
          } else {
              setImportData(result);
              setImportError(null);
          }
      };
      reader.readAsText(file, "UTF-8");
  };

  const processImport = () => {
      importData.forEach(mat => onAddMaterial(mat));
      setIsImportModalOpen(false);
      setImportData([]);
      alert(`Đã nhập thành công ${importData.length} vật tư vào kho.`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ShieldAlert className="text-red-600" size={28} /> 
             Kho Vật Tư - Thiết Bị PCCC
           </h2>
           <p className="text-slate-500 text-sm mt-1">Quản lý tồn kho, điều chỉnh số lượng và nhập dữ liệu hàng loạt.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
                Danh sách kho
            </button>
            <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
                <BrainCircuit size={16} /> AI Phân tích
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 mb-1">Tổng thiết bị</p>
                  <h3 className="text-2xl font-bold text-slate-800">{totalItems.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                  <Package size={24} />
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 mb-1">Dưới định mức</p>
                  <h3 className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-orange-600' : 'text-slate-800'}`}>{lowStockCount}</h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                  <AlertTriangle size={24} />
              </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                  <p className="text-sm text-slate-500 mb-1">Hết hạn kiểm định</p>
                  <h3 className={`text-2xl font-bold ${expiredCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>{expiredCount}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-full text-red-600">
                  <AlertCircle size={24} />
              </div>
          </div>
      </div>

      {activeTab === 'analysis' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-slide-down">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                  <div>
                      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <BrainCircuit className="text-indigo-600" /> Phân tích kho PCCC bằng AI
                      </h3>
                      <p className="text-sm text-slate-500">Dự báo nhu cầu và cảnh báo rủi ro thiết bị.</p>
                  </div>
                  <button 
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md flex items-center gap-2"
                  >
                      {isAnalyzing ? 'Đang phân tích...' : 'Chạy AI Analysis'}
                  </button>
              </div>
              <div className="p-6 min-h-[300px]">
                  {!aiAnalysis ? (
                      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                          <BrainCircuit size={48} className="mb-4 opacity-20" />
                          <p>Nhấn nút để AI rà soát dữ liệu kho hiện tại.</p>
                      </div>
                  ) : (
                      <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line animate-fade-in">
                          {aiAnalysis}
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'inventory' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-2 w-full md:w-auto flex-1">
                      <div className="relative flex-1 md:max-w-xs">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                              type="text"
                              placeholder="Tìm kiếm vật tư..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                          />
                      </div>
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
                          <Filter size={16} className="text-slate-400 ml-2" />
                          <select 
                              value={filterCategory}
                              onChange={(e) => setFilterCategory(e.target.value as any)}
                              className="bg-transparent text-sm text-slate-700 outline-none border-none py-1 pr-2 cursor-pointer"
                          >
                              <option value="ALL">Tất cả danh mục</option>
                              {categories.map(c => (
                                  <option key={c} value={c}>{c}</option>
                              ))}
                          </select>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <FileUp size={16} /> Nhập Excel/CSV
                    </button>
                    <button 
                        onClick={handleAddNew}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> Thêm vật tư
                    </button>
                  </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                          <tr>
                              <th className="px-6 py-4">Tên thiết bị / Vật tư</th>
                              <th className="px-6 py-4">Thông số (Spec)</th>
                              <th className="px-6 py-4 text-center">Điều chỉnh SL Khả dụng</th>
                              <th className="px-6 py-4 text-center">Tổng kho</th>
                              <th className="px-6 py-4">Trạng thái</th>
                              <th className="px-6 py-4">Hạn kiểm định</th>
                              <th className="px-6 py-4 text-right">Thao tác</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredMaterials.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="font-medium text-slate-800">{item.name}</div>
                                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block uppercase font-bold">{item.category}</span>
                                  </td>
                                  <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.spec}</td>
                                  <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center gap-3">
                                          <button 
                                            onClick={() => adjustQuantity(item, -1)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all border border-transparent hover:border-red-100"
                                            title="Giảm 1"
                                          >
                                              <Minus size={14} />
                                          </button>
                                          <div className="min-w-[40px] text-center">
                                              <span className={`font-bold text-base ${item.availableQuantity <= item.minStockLevel ? 'text-red-600' : 'text-slate-800'}`}>
                                                  {item.availableQuantity}
                                              </span>
                                          </div>
                                          <button 
                                            onClick={() => adjustQuantity(item, 1)}
                                            className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-all border border-transparent hover:border-green-100"
                                            title="Tăng 1"
                                          >
                                              <PlusCircle size={14} />
                                          </button>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="text-sm font-medium text-slate-600">{item.totalQuantity}</span>
                                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                      {item.availableQuantity <= item.minStockLevel ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                                              <AlertTriangle size={12} /> Sắp hết
                                          </span>
                                      ) : item.status === 'Expired' || (item.inspectionExpiry && isExpired(item.inspectionExpiry)) ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                                              <AlertCircle size={12} /> Quá hạn
                                          </span>
                                      ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-green-50 text-green-700 border border-green-200">
                                              <CheckCircle2 size={12} /> Đầy đủ
                                          </span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4">
                                      {item.inspectionExpiry ? (
                                          <div className={`flex items-center gap-1.5 text-xs ${isExpired(item.inspectionExpiry) ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                                              <Calendar size={14} />
                                              {new Date(item.inspectionExpiry).toLocaleDateString('vi-VN')}
                                          </div>
                                      ) : (
                                          <span className="text-[10px] text-slate-300 italic">Chưa cập nhật</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => handleEdit(item)}
                                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Sửa chi tiết"
                                          >
                                              <Edit size={16} />
                                          </button>
                                          <button 
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Xóa"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileUp className="text-blue-600" /> Nhập vật tư hàng loạt
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">Sử dụng file Excel hoặc CSV để thêm nhiều vật tư cùng lúc.</p>
                      </div>
                      <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="p-6 flex-1 overflow-y-auto space-y-6">
                      <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="text-sm text-blue-800 flex-1">
                              <p className="font-bold flex items-center gap-2 mb-1 uppercase tracking-tight">
                                <AlertCircle size={16} /> Quy trình nhập dữ liệu:
                              </p>
                              <ol className="list-decimal ml-5 space-y-0.5 opacity-80">
                                <li>Tải file mẫu về máy tính (.csv)</li>
                                <li>Điền đầy đủ thông tin vào file mẫu</li>
                                <li>Tải file đã điền lên hệ thống và kiểm tra dữ liệu</li>
                              </ol>
                          </div>
                          <button 
                            onClick={downloadTemplate}
                            className="w-full md:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center justify-center gap-2 shadow-lg shadow-blue-100 transition-all hover:-translate-y-0.5"
                          >
                              <Download size={18} /> Tải file mẫu ngay
                          </button>
                      </div>

                      <div className="space-y-4">
                          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <div className="p-4 bg-slate-50 rounded-full mb-3 group-hover:scale-110 group-hover:bg-blue-50 transition-all">
                                    <FileUp size={32} className="text-slate-400 group-hover:text-blue-600" />
                                  </div>
                                  <p className="text-sm text-slate-600 font-bold">Chọn tệp tin dữ liệu (.csv)</p>
                                  <p className="text-xs text-slate-400 mt-1">Hoặc kéo thả file vào vùng này</p>
                              </div>
                              <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                          </label>
                          
                          {importError && (
                              <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-center gap-3 animate-shake">
                                  <AlertCircle size={20} /> {importError}
                              </div>
                          )}

                          {importData.length > 0 && (
                              <div className="space-y-3 animate-slide-up">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Xem trước dữ liệu ({importData.length} vật tư)</h4>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Cấu trúc hợp lệ</span>
                                  </div>
                                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                                      <table className="w-full text-[11px] text-left">
                                          <thead className="bg-slate-100 text-slate-600 sticky top-0 font-bold uppercase tracking-tighter">
                                              <tr>
                                                  <th className="px-3 py-2.5">Tên vật tư</th>
                                                  <th className="px-3 py-2.5">Loại</th>
                                                  <th className="px-3 py-2.5 text-center">SL</th>
                                                  <th className="px-3 py-2.5">Hạn KĐ</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-200">
                                              {importData.map((d, i) => (
                                                  <tr key={i} className="hover:bg-white">
                                                      <td className="px-3 py-2 font-medium text-slate-700">{d.name}</td>
                                                      <td className="px-3 py-2 text-slate-500">{d.category}</td>
                                                      <td className="px-3 py-2 text-center font-mono text-slate-600">{d.availableQuantity}/{d.totalQuantity}</td>
                                                      <td className="px-3 py-2 text-slate-500">{d.inspectionExpiry || '-'}</td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 px-8">
                      <button 
                        onClick={() => {
                            setIsImportModalOpen(false);
                            setImportData([]);
                        }}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
                      >
                          Hủy bỏ
                      </button>
                      <button 
                        disabled={importData.length === 0}
                        onClick={processImport}
                        className="px-8 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-40 shadow-lg shadow-green-100 transition-all active:scale-95"
                      >
                          Xác nhận nhập kho
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
                      <h3 className="text-lg font-bold text-slate-800">
                          {editingMaterial ? 'Cập nhật thông tin vật tư' : 'Thêm vật tư PCCC mới'}
                      </h3>
                      <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-all">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên thiết bị / vật tư</label>
                          <input 
                              required
                              type="text" 
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                              placeholder="VD: Đầu phun Sprinkler..."
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Danh mục</label>
                              <select 
                                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all cursor-pointer"
                                  value={formData.category}
                                  onChange={(e) => handleInputChange('category', e.target.value)}
                              >
                                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Đơn vị tính</label>
                              <input 
                                  required
                                  type="text" 
                                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                  value={formData.unit}
                                  onChange={(e) => handleInputChange('unit', e.target.value)}
                                  placeholder="Bộ, Cái, Mét..."
                              />
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Thông số kỹ thuật (Spec)</label>
                          <input 
                              type="text" 
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all"
                              value={formData.spec}
                              onChange={(e) => handleInputChange('spec', e.target.value)}
                              placeholder="VD: DN100 Sch40, 68°C K=5.6..."
                          />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tổng SL</label>
                              <input 
                                  required
                                  type="number" 
                                  min="0"
                                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all font-mono"
                                  value={formData.totalQuantity}
                                  onChange={(e) => handleInputChange('totalQuantity', parseInt(e.target.value) || 0)}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Khả dụng</label>
                              <input 
                                  required
                                  type="number" 
                                  min="0"
                                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all font-mono"
                                  value={formData.availableQuantity}
                                  onChange={(e) => handleInputChange('availableQuantity', parseInt(e.target.value) || 0)}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mức tối thiểu</label>
                              <input 
                                  type="number" 
                                  min="0"
                                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all font-mono"
                                  value={formData.minStockLevel}
                                  onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
                              />
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Hạn kiểm định</label>
                          <input 
                              type="date" 
                              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 focus:bg-white transition-all cursor-pointer"
                              value={formData.inspectionExpiry || ''}
                              onChange={(e) => handleInputChange('inspectionExpiry', e.target.value)}
                          />
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                          <button 
                              type="button"
                              onClick={() => setIsFormOpen(false)}
                              className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all"
                          >
                              Hủy bỏ
                          </button>
                          <button 
                              type="submit"
                              className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-slate-100 transition-all hover:-translate-y-0.5"
                          >
                              <Save size={18} /> Lưu thông tin vật tư
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default PCCCWarehouse;
