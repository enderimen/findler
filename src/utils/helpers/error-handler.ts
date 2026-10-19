/**
 * Yakalanan hatayı kullanıcıya gösterilecek mesaja çevirir.
 * @param error - Yakalanan hata
 * @returns Hata mesajı (string)
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Bilinmeyen bir hata oluştu';
};
