-- Xóa các bảng cũ để tạo lại từ đầu cho đồng bộ
DROP TABLE IF EXISTS qaqc_tasks;
DROP TABLE IF EXISTS pccc_materials;
DROP TABLE IF EXISTS projects;

-- 1. Bảng Projects (Bổ sung cột 'code', 'startDate', 'endDate')
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" TEXT, -- Cột bị thiếu dẫn đến lỗi
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Planning',
    budget BIGINT DEFAULT 0,
    spent BIGINT DEFAULT 0,
    "startDate" DATE, -- Dùng ngoặc kép để giữ camelCase
    "endDate" DATE,
    tasks JSONB DEFAULT '[]'::jsonb,
    financials JSONB DEFAULT '[]'::jsonb,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Bảng Materials (Bổ sung cột 'allocatedTo', 'lastUpdated')
CREATE TABLE pccc_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    unit TEXT,
    quantity INTEGER DEFAULT 0,
    "minStock" INTEGER DEFAULT 0,
    "allocatedTo" TEXT, -- Cột bị thiếu dẫn đến lỗi
    location TEXT,
    "lastUpdated" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Bảng QAQC Tasks (Bổ sung cột 'category', 'projectId')
CREATE TABLE qaqc_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- Cột bị thiếu dẫn đến lỗi
    status TEXT DEFAULT 'Pending',
    "projectId" UUID REFERENCES projects(id) ON DELETE CASCADE,
    "dueDate" DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tắt RLS để ứng dụng nạp dữ liệu ngay
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE pccc_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE qaqc_tasks DISABLE ROW LEVEL SECURITY;