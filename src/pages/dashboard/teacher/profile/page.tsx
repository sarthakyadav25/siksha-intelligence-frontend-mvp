import { useState } from "react";
import { motion } from "framer-motion";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateBasicProfile } from "@/store/slices/teacherSlice";
import { toast } from "sonner";
import {
  Lock,
  Edit3,
  Phone,
  MapPin,
  FileText,
  Hash,
  Building,
  User,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/services/profile";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TeacherProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const basicProfile = useAppSelector((s) => s.teacher.basicProfile);

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => profileService.getMyProfile().then((res) => res.data),
  });

  // Edit modal state
  const [editBio, setEditBio] = useState(basicProfile.bio);
  const [editPhone, setEditPhone] = useState(basicProfile.phone);
  const [editAddress, setEditAddress] = useState(basicProfile.address);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    dispatch(updateBasicProfile({ bio: editBio, phone: editPhone, address: editAddress }));
    toast.success("Profile updated successfully");
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setEditBio(basicProfile.bio);
      setEditPhone(basicProfile.phone);
      setEditAddress(basicProfile.address);
    }
  };

  const fullName = profile
    ? `${profile.basicProfile.firstName ?? ""} ${profile.basicProfile.lastName ?? ""}`.trim()
    : user?.username ?? "Teacher";
  const employeeId = profile?.staffDetails?.staffSystemId ?? user?.userId ?? "N/A";
  const department = profile?.staffDetails?.department ?? "Science Department";

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-10 max-w-4xl">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View and manage your profile information.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <UserAvatar
            name={fullName}
            profileUrl={profile?.basicProfile.profileUrl ?? user?.profileUrl}
            className="h-24 w-24 ring-4 ring-primary/10 text-2xl"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.staffDetails?.jobTitle ?? "Senior Teacher"} · {department}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {profile?.basicProfile.email ?? user?.email}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Read-Only Fields */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Official Details</h3>
          <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Read Only
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Full Name</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{fullName}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Employee ID</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{employeeId}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Department</span>
            </div>
            <p className="text-sm font-semibold text-foreground">{department}</p>
          </div>
        </div>
      </motion.div>

      {/* Editable Fields */}
      <motion.div variants={item} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Edit3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Personal Details</h3>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-xs">
                <Edit3 className="h-3 w-3" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Personal Details</DialogTitle>
                <DialogDescription>
                  Update your bio, phone number, and home address.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-xs font-medium text-foreground">Bio</label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Home Address</label>
                  <textarea
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </DialogClose>
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Bio</span>
            </div>
            <p className="text-sm text-foreground">{basicProfile.bio}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Phone Number</span>
              </div>
              <p className="text-sm font-medium text-foreground">{basicProfile.phone}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Home Address</span>
              </div>
              <p className="text-sm text-foreground">{basicProfile.address}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
