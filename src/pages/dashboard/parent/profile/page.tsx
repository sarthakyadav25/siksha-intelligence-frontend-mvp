import { User, Mail, Phone, MapPin, Edit, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default function ProfilePage() {
  const { user } = useAppSelector(state => state.auth);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-8 w-8 text-primary" />
            My Profile
          </h1>
          <p className="text-muted-foreground mt-1">Manage your personal details and app security.</p>
        </div>
        <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "default"}>
          {isEditing ? "Cancel" : <><Edit className="w-4 h-4 mr-2" /> Edit Profile</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-1 flex flex-col items-center text-center space-y-4">
          <UserAvatar name={user?.username || "Parent Profile"} profileUrl={user?.profileUrl} className="w-32 h-32 text-4xl shadow-sm border-4 border-background ring-4 ring-primary/20" />
          <div>
            <h2 className="text-xl font-bold">{user?.username || "Mr. Rahul Sharma"}</h2>
            <p className="text-muted-foreground">{user?.email || "parent@edusync.com"}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <Shield className="w-3 h-3" /> Guardian Account
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2 space-y-6">
          <h3 className="font-bold border-b pb-4">Personal Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input disabled={!isEditing} defaultValue={user?.username || "Rahul Sharma"} className="pl-9" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input disabled={!isEditing} defaultValue={user?.email || "parent@edusync.com"} className="pl-9" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input disabled={!isEditing} defaultValue="+91 98765 43210" className="pl-9" />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Residential Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <textarea disabled={!isEditing} defaultValue="B-402, Green Valley Apartments, Kharadi, Pune, Maharashtra 411014" className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9" />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end pt-4 border-t">
              <Button>Save Changes</Button>
            </div>
          )}
        </Card>

        <Card className="p-6 md:col-span-3 border-rose-500/20 bg-rose-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-rose-600 flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5" /> Account Security
              </h3>
              <p className="text-sm text-muted-foreground">It is highly recommended to change your password regularly.</p>
            </div>
            <Button variant="outline" className="text-rose-600 border-rose-200 bg-background hover:bg-rose-50">Change Password</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
