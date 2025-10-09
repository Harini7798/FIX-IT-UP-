-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('repair_request', 'status_update', 'review', 'message', 'general')),
  link text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create policy for inserting notifications (system level)
CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Update profiles RLS to allow public viewing
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create function to notify on new repair request
CREATE OR REPLACE FUNCTION notify_repair_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_owner_id uuid;
  item_title text;
  fixer_name text;
BEGIN
  -- Get item owner and title
  SELECT user_id, title INTO item_owner_id, item_title
  FROM items
  WHERE id = NEW.item_id;
  
  -- Get fixer name
  SELECT display_name INTO fixer_name
  FROM profiles
  WHERE user_id = NEW.fixer_id;
  
  -- Create notification for item owner
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    item_owner_id,
    'New Repair Request',
    COALESCE(fixer_name, 'A fixer') || ' has offered to repair your ' || item_title,
    'repair_request',
    '/item/' || NEW.item_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new repair requests
CREATE TRIGGER on_repair_request_created
AFTER INSERT ON repair_requests
FOR EACH ROW
EXECUTE FUNCTION notify_repair_request();

-- Create function to notify on status update
CREATE OR REPLACE FUNCTION notify_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_owner_id uuid;
  item_title text;
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get item owner and title
    SELECT user_id, title INTO item_owner_id, item_title
    FROM items
    WHERE id = NEW.item_id;
    
    -- Notify item owner
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      item_owner_id,
      'Repair Status Updated',
      'Your ' || item_title || ' repair status changed to: ' || NEW.status,
      'status_update',
      '/item/' || NEW.item_id
    );
    
    -- Also notify fixer if completed
    IF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.fixer_id,
        'Repair Completed',
        'You marked ' || item_title || ' as completed',
        'status_update',
        '/item/' || NEW.item_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for status updates
CREATE TRIGGER on_repair_status_updated
AFTER UPDATE ON repair_requests
FOR EACH ROW
EXECUTE FUNCTION notify_status_update();

-- Create function to notify on new review
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name text;
BEGIN
  -- Get reviewer name
  SELECT display_name INTO reviewer_name
  FROM profiles
  WHERE user_id = NEW.reviewer_id;
  
  -- Notify reviewed user
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.reviewed_id,
    'New Review Received',
    COALESCE(reviewer_name, 'Someone') || ' left you a ' || NEW.rating || '-star review',
    'review',
    '/profile'
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_review_created ON reviews;

CREATE TRIGGER on_review_created_notification
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_new_review();