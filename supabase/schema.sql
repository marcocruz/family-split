-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT NOT NULL DEFAULT 'MXN',
  cover_emoji TEXT DEFAULT '🏠',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Group members table
CREATE TABLE group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN NOT NULL DEFAULT false,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, emoji, color, is_default) VALUES
  ('Comida', '🍽️', '#F97316', true),
  ('Transporte', '🚗', '#3B82F6', true),
  ('Hogar', '🏠', '#8B5CF6', true),
  ('Entretenimiento', '🎬', '#EC4899', true),
  ('Salud', '💊', '#EF4444', true),
  ('Supermercado', '🛒', '#10B981', true),
  ('Servicios', '💡', '#F59E0B', true),
  ('Viajes', '✈️', '#06B6D4', true),
  ('Educación', '📚', '#6366F1', true),
  ('Otros', '💰', '#6B7280', true);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'exact', 'percentage')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense splits table
CREATE TABLE expense_splits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(expense_id, user_id)
);

-- Payments table (to settle debts)
CREATE TABLE payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  from_user UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  to_user UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups policies
CREATE POLICY "Group members can view groups" ON groups FOR SELECT USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Group admins can update groups" ON groups FOR UPDATE USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Group admins can delete groups" ON groups FOR DELETE USING (
  id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);

-- Group members policies
CREATE POLICY "Group members can view members" ON group_members FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group admins can manage members" ON group_members FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
);
CREATE POLICY "Group admins can delete members" ON group_members FOR DELETE USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
);

-- Categories policies
CREATE POLICY "Everyone can view default categories" ON categories FOR SELECT USING (
  is_default = true
  OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group members can create categories" ON categories FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

-- Expenses policies
CREATE POLICY "Group members can view expenses" ON expenses FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group members can create expenses" ON expenses FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Expense creators can update expenses" ON expenses FOR UPDATE USING (
  created_by = auth.uid()
  OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Expense creators can delete expenses" ON expenses FOR DELETE USING (
  created_by = auth.uid()
  OR group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid() AND role = 'admin')
);

-- Expense splits policies
CREATE POLICY "Group members can view splits" ON expense_splits FOR SELECT USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Group members can manage splits" ON expense_splits FOR INSERT WITH CHECK (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Group members can update splits" ON expense_splits FOR UPDATE USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Group members can delete splits" ON expense_splits FOR DELETE USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- Payments policies
CREATE POLICY "Group members can view payments" ON payments FOR SELECT USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);
CREATE POLICY "Group members can create payments" ON payments FOR INSERT WITH CHECK (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
  AND from_user = auth.uid()
);

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
