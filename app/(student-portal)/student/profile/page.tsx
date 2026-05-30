import { getMyProfile } from "@/lib/dal/student-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { UserCircle, GraduationCap, MapPin, Phone, Building } from "lucide-react"

export const metadata = {
  title: "My Profile | SchoolPay",
}

export default async function StudentProfilePage() {
  const profile = await getMyProfile()

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-muted-foreground">View your personal and academic details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="md:col-span-1 border-primary/10 bg-primary/5">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="h-32 w-32 ring-4 ring-background">
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-muted-foreground">{profile.admissionNumber}</p>
            </div>
            <div className="w-full flex items-center justify-center gap-2 pt-2 text-sm font-medium">
              <GraduationCap className="h-4 w-4 text-primary" />
              Class {profile.class}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">School Name</p>
                <p className="font-medium mt-1">{profile.school.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Admission Number</p>
                <p className="font-mono mt-1">{profile.admissionNumber}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class / Grade</p>
                <p className="font-medium mt-1">{profile.class}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone Number
                </p>
                <p className="font-medium mt-1">{"Not provided"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="font-medium mt-1">{"Not provided"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </p>
                <p className="font-medium mt-1">
                  {"No address on file."}
                </p>
              </div>
            </CardContent>
          </Card>

          {profile.parent && (
            <Card>
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-muted-foreground" />
                  Parent/Guardian Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="font-medium mt-1">{profile.parent.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="font-medium mt-1">{profile.parent.mobile || "Not provided"}</p>
                </div>
                {profile.parent.email && (
                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium mt-1">{profile.parent.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
