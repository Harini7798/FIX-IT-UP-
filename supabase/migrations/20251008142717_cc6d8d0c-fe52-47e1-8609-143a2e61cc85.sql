-- Fix search paths for all database functions to prevent security issues

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;

-- Fix update_profile_rating function
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviewed_id = NEW.reviewed_id
    )
  WHERE user_id = NEW.reviewed_id;
  
  RETURN NEW;
END;
$function$;

-- Fix trigger_set_timestamp function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

-- Fix notify_repair_request function
CREATE OR REPLACE FUNCTION public.notify_repair_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix notify_new_review function
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- Fix notify_status_update function
CREATE OR REPLACE FUNCTION public.notify_status_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item_owner_id uuid;
  item_title text;
  fixer_name text;
BEGIN
  -- Only notify on status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get item owner and title
    SELECT user_id, title INTO item_owner_id, item_title
    FROM items
    WHERE id = NEW.item_id;
    
    -- Get fixer name
    SELECT display_name INTO fixer_name
    FROM profiles
    WHERE user_id = NEW.fixer_id;
    
    -- Handle different status transitions
    IF NEW.status = 'awaiting_confirmation' THEN
      -- Notify owner that work is ready for review
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        item_owner_id,
        'Work Ready for Review',
        COALESCE(fixer_name, 'Fixer') || ' has completed work on your ' || item_title || '. Please review and confirm.',
        'status_update',
        '/item/' || NEW.item_id
      );
    ELSIF NEW.status = 'completed' THEN
      -- Notify fixer that owner confirmed completion
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.fixer_id,
        'Work Confirmed Complete',
        'Owner confirmed completion of ' || item_title || '. You can now receive reviews.',
        'status_update',
        '/item/' || NEW.item_id
      );
    ELSE
      -- Default notification for other status changes
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        item_owner_id,
        'Repair Status Updated',
        'Your ' || item_title || ' repair status changed to: ' || NEW.status,
        'status_update',
        '/item/' || NEW.item_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;