-- Create trigger to update profile rating when a review is inserted
CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_rating();