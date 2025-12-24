
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, PCCCMaterial, AcceptanceTask } from '../types';
import { MOCK_PROJECTS, MOCK_PCCC_MATERIALS, MOCK_QAQC_TASKS } from '../constants';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class DatabaseService {
  private supabase: SupabaseClient | null = null;

  async init(): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("Supabase credentials missing.");
      return;
    }
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    await this.seedIfEmpty();
  }

  private async seedIfEmpty() {
    if (!this.supabase) return;
    try {
      const { count: pCount } = await this.supabase.from('projects').select('*', { count: 'exact', head: true });
      if (pCount === 0) {
        // Làm sạch dữ liệu mock trước khi seed
        const cleanMock = MOCK_PROJECTS.map(p => {
          const { address, ...rest } = p as any;
          return rest;
        });
        await this.supabase.from('projects').insert(cleanMock);
      }

      const { count: mCount } = await this.supabase.from('pccc_materials').select('*', { count: 'exact', head: true });
      if (mCount === 0) {
        await this.supabase.from('pccc_materials').insert(MOCK_PCCC_MATERIALS);
      }

      const { count: qCount } = await this.supabase.from('qaqc_tasks').select('*', { count: 'exact', head: true });
      if (qCount === 0) {
        await this.supabase.from('qaqc_tasks').insert(MOCK_QAQC_TASKS);
      }
    } catch (err) {
      console.warn("Seeding process skipped or failed silently.");
    }
  }

  async getAll<T>(tableName: string): Promise<T[]> {
    if (!this.supabase) return [];
    const { data, error } = await this.supabase.from(tableName).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return [];
    }
    return (data || []) as T[];
  }

  async save<T>(tableName: string, data: any): Promise<void> {
    if (!this.supabase) return;
    
    // Logic phòng vệ: Luôn đảm bảo không gửi trường 'address' lên bảng projects
    let cleanData = { ...data };
    if (tableName === 'projects') {
      if ('address' in cleanData) delete cleanData.address;
      // Đảm bảo id hợp lệ
      if (!cleanData.id) cleanData.id = `p-${Date.now()}`;
    }
    
    const { error } = await this.supabase.from(tableName).upsert(cleanData);
    if (error) {
        console.error(`Supabase Upsert Error (${tableName}):`, error);
        throw new Error(error.message);
    }
  }

  async delete(tableName: string, id: string): Promise<void> {
    if (!this.supabase) return;
    const { error } = await this.supabase.from(tableName).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const dbService = new DatabaseService();
