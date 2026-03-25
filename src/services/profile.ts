import { api } from "@/lib/axios";
import type {
  UserProfileUpdateDTO,
  UserProfileDTO,
  ComprehensiveUserProfileResponseDTO,
} from "./types/profile";
import type {
  ImageUploadInitRequest,
  ImageUploadInstruction,
  ImageUploadCompleteRequest
} from './types/media';

// ── Profile Service ──────────────────────────────────────────────────

export const profileService = {
  /** GET /profile/me */
  getMyProfile() {
    return api.get<ComprehensiveUserProfileResponseDTO>("/profile/me");
  },

  /** PUT /profile/me */
  updateMyProfile(data: UserProfileUpdateDTO) {
    return api.put<UserProfileDTO>("/profile/me", data);
  },

  // --- Profile Image Upload ---
  initProfileImageUpload(data: ImageUploadInitRequest) {
    return api.post<ImageUploadInstruction>('/profile/me/image/upload-init', data);
  },

  completeProfileImageUpload(data: ImageUploadCompleteRequest) {
    // Assuming backend returns the updated BasicProfileDTO showing the new profileUrl
    return api.post<UserProfileDTO>('/profile/me/image/upload-complete', data);
  },

  /** GET /profile/:userId (admin) */
  getProfileByUserId(userId: number) {
    return api.get<ComprehensiveUserProfileResponseDTO>(`/profile/${userId}`);
  },

  /** PUT /profile/:userId (admin) */
  updateProfileByUserId(userId: number, data: UserProfileUpdateDTO) {
    return api.put<UserProfileDTO>(`/profile/${userId}`, data);
  },
};
