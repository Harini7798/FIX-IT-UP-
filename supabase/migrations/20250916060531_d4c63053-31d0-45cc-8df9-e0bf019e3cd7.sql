-- Create enum for item categories
CREATE TYPE public.item_category AS ENUM (
  'electronics',
  'clothing',
  'furniture',
  'books',
  'bikes',
  'appliances',
  'sports',
  'other'
);

-- Create enum for item status
CREATE TYPE public.item_status AS ENUM (
  'posted',
  'in_progress',
  'completed',
  'sold',
  'cancelled'
);

-- Create enum for user role
CREATE TYPE public.user_role AS ENUM (
  'requester',
  'fixer',
  'both'
);

-- Create enum for repair request status
CREATE TYPE public.repair_status AS ENUM (
  'open',
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

-- Add role to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role DEFAULT 'requester',
ADD COLUMN skills TEXT[],
ADD COLUMN bio TEXT,
ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN total_reviews INTEGER DEFAULT 0;

-- Create items table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.item_category NOT NULL,
  images TEXT[],
  estimated_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  location TEXT,
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status public.item_status NOT NULL DEFAULT 'posted',
  is_for_sale BOOLEAN DEFAULT FALSE,
  sale_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repair_requests table
CREATE TABLE public.repair_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  fixer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  proposed_price DECIMAL(10,2) NOT NULL,
  estimated_completion DATE,
  message TEXT,
  status public.repair_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_request_id UUID NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repair_request_id UUID NOT NULL REFERENCES public.repair_requests(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for items
CREATE POLICY "Items are viewable by everyone" 
ON public.items FOR SELECT USING (true);

CREATE POLICY "Users can create their own items" 
ON public.items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for repair_requests
CREATE POLICY "Repair requests are viewable by item owner and fixer" 
ON public.repair_requests FOR SELECT USING (
  auth.uid() = fixer_id OR 
  auth.uid() = (SELECT user_id FROM public.items WHERE id = item_id)
);

CREATE POLICY "Fixers can create repair requests" 
ON public.repair_requests FOR INSERT WITH CHECK (auth.uid() = fixer_id);

CREATE POLICY "Fixers can update their own requests" 
ON public.repair_requests FOR UPDATE USING (auth.uid() = fixer_id);

-- Create RLS policies for messages
CREATE POLICY "Messages are viewable by participants" 
ON public.messages FOR SELECT USING (
  auth.uid() = sender_id OR 
  auth.uid() = (
    SELECT fixer_id FROM public.repair_requests WHERE id = repair_request_id
  ) OR
  auth.uid() = (
    SELECT items.user_id FROM public.items 
    JOIN public.repair_requests ON items.id = repair_requests.item_id 
    WHERE repair_requests.id = repair_request_id
  )
);

CREATE POLICY "Participants can send messages" 
ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND (
    auth.uid() = (
      SELECT fixer_id FROM public.repair_requests WHERE id = repair_request_id
    ) OR
    auth.uid() = (
      SELECT items.user_id FROM public.items 
      JOIN public.repair_requests ON items.id = repair_requests.item_id 
      WHERE repair_requests.id = repair_request_id
    )
  )
);

-- Create RLS policies for reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for completed repairs" 
ON public.reviews FOR INSERT WITH CHECK (
  auth.uid() = reviewer_id AND
  EXISTS (
    SELECT 1 FROM public.repair_requests 
    WHERE id = repair_request_id 
    AND status = 'completed'
    AND (fixer_id = auth.uid() OR 
         (SELECT user_id FROM public.items WHERE id = item_id) = auth.uid())
  )
);

-- Create triggers for updated_at (skip profiles since it already exists)
CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_repair_requests_updated_at
  BEFORE UPDATE ON public.repair_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_items_category ON public.items(category);
CREATE INDEX idx_items_status ON public.items(status);
CREATE INDEX idx_items_user_id ON public.items(user_id);
CREATE INDEX idx_repair_requests_item_id ON public.repair_requests(item_id);
CREATE INDEX idx_repair_requests_fixer_id ON public.repair_requests(fixer_id);
CREATE INDEX idx_messages_repair_request_id ON public.messages(repair_request_id);
CREATE INDEX idx_reviews_reviewed_id ON public.reviews(reviewed_id);