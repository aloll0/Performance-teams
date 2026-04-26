// import { useMemo, useState } from 'react';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import {
//   Album,
//   BadgeCheck,
//   CheckCircle2,
//   Circle,     
//   ExternalLink,
//   Plus,
//   Sparkles,
//   Trash2,
//   UserCheck,
//   Video,
//   X
// } from 'lucide-react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { useAuthStore } from '@/store/authStore';
// import {
//   addLearningCourseVideo,
//   createLearningCourse,
//   deleteLearningCourse,
//   getLearningCourses,
//   removeLearningCourseVideo,
//   setLearningCourseCompletion
// } from '@/services/learningCourseApi';
// import { getAllTeams } from '@/services/teamApi';
// import type { LearningCourse } from '@/types';
// import { toast } from 'sonner';

// const CoursesPage = () => {
//   const { user } = useAuthStore();
//   const queryClient = useQueryClient();
//   const canManageCourses = user?.role === 'admin' || user?.role === 'team_leader';
//   const isAdmin = user?.role === 'admin';

//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [focusFilter, setFocusFilter] = useState('all');
//   const [videoFormByCourse, setVideoFormByCourse] = useState<Record<string, { title: string; url: string }>>({});
//   const [formData, setFormData] = useState({
//     title: '',
//     url: '',
//     platform: '',
//     focusArea: '',
//     notes: '',
//     team: user?.team || ''
//   });

//   const { data: courses, isLoading } = useQuery({
//     queryKey: ['learning-courses'],
//     queryFn: async () => {
//       const response = await getLearningCourses();
//       return response.data as LearningCourse[];
//     }
//   });

//   const { data: teams } = useQuery({
//     queryKey: ['teams'],
//     queryFn: async () => {
//       const response = await getAllTeams();
//       return response.data;
//     },
//     enabled: isAdmin
//   });

//   const createMutation = useMutation({
//     mutationFn: createLearningCourse,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
//       toast.success('Course added for your team');
//       setIsCreateOpen(false);
//       setFormData({
//         title: '',
//         url: '',
//         platform: '',
//         focusArea: '',
//         notes: '',
//         team: user?.team || ''
//       });
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to add course');
//     }
//   });

//   const completionMutation = useMutation({
//     mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
//       setLearningCourseCompletion(id, completed),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to update completion');
//     }
//   });

//   const deleteMutation = useMutation({
//     mutationFn: deleteLearningCourse,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
//       toast.success('Course removed');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to remove course');
//     }
//   });

//   const addVideoMutation = useMutation({
//     mutationFn: ({ id, title, url }: { id: string; title: string; url: string }) =>
//       addLearningCourseVideo(id, { title, url }),
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
//       setVideoFormByCourse((prev) => ({
//         ...prev,
//         [variables.id]: { title: '', url: '' }
//       }));
//       toast.success('Video added');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to add video');
//     }
//   });

//   const removeVideoMutation = useMutation({
//     mutationFn: ({ id, videoId }: { id: string; videoId: string }) =>
//       removeLearningCourseVideo(id, videoId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['learning-courses'] });
//       toast.success('Video removed');
//     },
//     onError: (error: any) => {
//       toast.error(error.response?.data?.message || 'Failed to remove video');
//     }
//   });

//   const focusAreas = useMemo(() => {
//     const all = (courses || [])
//       .map((course) => course.focusArea?.trim())
//       .filter((value): value is string => Boolean(value));
//     return ['all', ...new Set(all)];
//   }, [courses]);

//   const filteredCourses = useMemo(() => {
//     if (!courses) return [];
//     if (focusFilter === 'all') return courses;
//     return courses.filter((course) => course.focusArea?.toLowerCase() === focusFilter.toLowerCase());
//   }, [courses, focusFilter]);

//   const completedCount = filteredCourses.filter((course) => course.isCompletedByMe).length;

//   const getCourseVideos = (course: LearningCourse) => {
//     if (course.videos?.length) {
//       return course.videos;
//     }

//     if (course.url) {
//       return [{ id: `${course.id}-legacy`, title: course.title, url: course.url }];
//     }

//     return [];
//   };

//   const handleAddVideo = (courseId: string) => {
//     const formState = videoFormByCourse[courseId] || { title: '', url: '' };
//     const normalizedUrl = formState.url.trim();
//     if (!normalizedUrl) {
//       toast.error('Video URL is required');
//       return;
//     }

//     addVideoMutation.mutate({
//       id: courseId,
//       title: formState.title.trim(),
//       url: normalizedUrl
//     });
//   };

//   const handleCreateCourse = (e: React.FormEvent) => {
//     e.preventDefault();

//     const normalizedTeam = (isAdmin ? formData.team : user?.team || '').trim();
//     if (!normalizedTeam) {
//       toast.error('Please select a team');
//       return;
//     }

//     createMutation.mutate({
//       title: formData.title,
//       url: formData.url,
//       platform: formData.platform,
//       focusArea: formData.focusArea,
//       notes: formData.notes,
//       team: normalizedTeam
//     });
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-96">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F26B21]"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <Card className="bg-gradient-to-r from-[#151c40] via-[#10193b] to-[#0D132C] border-white/10 overflow-hidden">
//         <CardContent className="p-6 sm:p-8">
//           <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
//             <div className="space-y-3">
//               <Badge className="bg-[#F26B21]/20 text-[#F9A56D] border-[#F26B21]/30 hover:bg-[#F26B21]/20">
//                 <Sparkles className="w-4 h-4 mr-2" />
//                 Team Upskilling Hub
//               </Badge>
//               <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
//                 Build skill power, one course at a time
//               </h1>
//               <p className="text-white/70 max-w-2xl">
//                 {user?.role === 'team_leader'
//                   ? 'Add high-impact resources for your team and track who completed each one.'
//                   : 'Follow your team learning plan and mark courses as completed when you finish them.'}
//               </p>
//             </div>

//             {canManageCourses && (
//               <Button
//                 onClick={() => setIsCreateOpen(true)}
//                 className="bg-[#F26B21] hover:bg-[#d95e19] text-white"
//               >
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add Course Link
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//         <Card className="bg-white/5 border-white/10">
//           <CardHeader className="pb-2">
//             <CardDescription className="text-white/60">My Progress</CardDescription>
//             <CardTitle className="text-white text-2xl">
//               {completedCount} / {filteredCourses.length}
//             </CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Progress
//               value={filteredCourses.length ? (completedCount / filteredCourses.length) * 100 : 0}
//               className="bg-white/10"
//             />
//           </CardContent>
//         </Card>

//         <Card className="bg-white/5 border-white/10 lg:col-span-2">
//           <CardHeader className="pb-2">
//             <CardDescription className="text-white/60">Filter by Focus Area</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-wrap gap-2">
//               {focusAreas.map((focus) => (
//                 <Button
//                   key={focus}
//                   size="sm"
//                   variant={focusFilter === focus ? 'default' : 'outline'}
//                   className={
//                     focusFilter === focus
//                       ? 'bg-[#F26B21] text-white hover:bg-[#d95e19]'
//                       : 'border-white/20 text-white/80 hover:bg-white/10'
//                   }
//                   onClick={() => setFocusFilter(focus)}
//                 >
//                   {focus === 'all' ? 'All' : focus}
//                 </Button>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
//         {filteredCourses.map((course) => (
//           <Card key={course.id} className="bg-white/5 border-white/10 hover:border-[#F26B21]/40 transition-colors">
//             <CardHeader className="space-y-3">
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <CardTitle className="text-white text-xl">{course.title}</CardTitle>
//                   <CardDescription className="text-white/60 mt-1 flex items-center gap-2">
//                     <Album className="w-4 h-4" />
//                     {course.platform || 'Learning Resource'}
//                   </CardDescription>
//                 </div>
//                 <Badge
//                   variant="outline"
//                   className={course.isCompletedByMe ? 'border-green-400/40 text-green-300' : 'border-white/20 text-white/60'}
//                 >
//                   {course.isCompletedByMe ? 'Completed' : 'Pending'}
//                 </Badge>
//               </div>

//               <div className="flex flex-wrap gap-2">
//                 <Badge variant="outline" className="border-[#F26B21]/30 text-[#F9A56D]">
//                   {course.focusArea || 'General'}
//                 </Badge>
//                 <Badge variant="outline" className="border-white/20 text-white/70">
//                   Team: {course.team}
//                 </Badge>
//               </div>
//             </CardHeader>

//             <CardContent className="space-y-4">
//               {course.notes && <p className="text-sm text-white/70">{course.notes}</p>}

//               <div className="space-y-2">
//                 <p className="text-xs uppercase tracking-wide text-white/50">Course Videos</p>
//                 <div className="space-y-2">
//                   {getCourseVideos(course).map((video) => (
//                     <div
//                       key={video.id}
//                       className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2"
//                     >
//                       <a
//                         href={video.url}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="min-w-0 flex items-center gap-2 text-[#F9A56D] hover:text-[#F26B21] transition-colors"
//                       >
//                         <Video className="w-4 h-4" />
//                         <span className="truncate">{video.title?.trim() || 'Open video'}</span>
//                         <ExternalLink className="w-4 h-4" />
//                       </a>

//                       {canManageCourses && (user?.role === 'admin' || user?.team === course.team) && course.videos?.length > 1 && (
//                         <Button
//                           variant="ghost"
//                           size="icon-sm"
//                           className="text-red-300 hover:bg-red-500/10"
//                           onClick={() => removeVideoMutation.mutate({ id: course.id, videoId: video.id })}
//                           disabled={removeVideoMutation.isPending}
//                         >
//                           <X className="w-4 h-4" />
//                         </Button>
//                       )}
//                     </div>
//                   ))}
//                 </div>

//                 {canManageCourses && (user?.role === 'admin' || user?.team === course.team) && (
//                   <div className="rounded-md border border-white/10 bg-white/[0.03] p-3 space-y-2">
//                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//                       <Input
//                         placeholder="Video title"
//                         value={videoFormByCourse[course.id]?.title || ''}
//                         onChange={(e) =>
//                           setVideoFormByCourse((prev) => ({
//                             ...prev,
//                             [course.id]: {
//                               title: e.target.value,
//                               url: prev[course.id]?.url || ''
//                             }
//                           }))
//                         }
//                         className="sm:col-span-1 bg-white/5 border-white/10 text-white"
//                       />
//                       <Input
//                         placeholder="https://video-link"
//                         value={videoFormByCourse[course.id]?.url || ''}
//                         onChange={(e) =>
//                           setVideoFormByCourse((prev) => ({
//                             ...prev,
//                             [course.id]: {
//                               title: prev[course.id]?.title || '',
//                               url: e.target.value
//                             }
//                           }))
//                         }
//                         className="sm:col-span-2 bg-white/5 border-white/10 text-white"
//                       />
//                     </div>
//                     <Button
//                       size="sm"
//                       className="bg-[#F26B21] hover:bg-[#d95e19] text-white"
//                       onClick={() => handleAddVideo(course.id)}
//                       disabled={addVideoMutation.isPending}
//                     >
//                       <Plus className="w-4 h-4 mr-2" />
//                       Add Video
//                     </Button>
//                   </div>
//                 )}
//               </div>

//               <div className="rounded-lg bg-white/5 border border-white/10 p-3">
//                 <div className="flex items-center justify-between text-sm mb-2">
//                   <span className="text-white/70 flex items-center gap-1">
//                     <UserCheck className="w-4 h-4" />
//                     Team completion
//                   </span>
//                   <span className="text-white font-medium">{course.completionRate}%</span>
//                 </div>
//                 <Progress value={course.completionRate} className="bg-white/10" />
//                 <p className="text-xs text-white/50 mt-2">
//                   {course.completionCount} completed out of {course.teamSize} members
//                 </p>
//               </div>

//               <div className="flex items-center gap-2">
//                 <Button
//                   onClick={() => completionMutation.mutate({ id: course.id, completed: !course.isCompletedByMe })}
//                   disabled={completionMutation.isPending}
//                   className={
//                     course.isCompletedByMe
//                       ? 'bg-green-600/20 text-green-200 border border-green-400/30 hover:bg-green-600/30'
//                       : 'bg-[#F26B21] hover:bg-[#d95e19] text-white'
//                   }
//                 >
//                   {course.isCompletedByMe ? (
//                     <>
//                       <BadgeCheck className="w-4 h-4 mr-2" />
//                       Mark as Incomplete
//                     </>
//                   ) : (
//                     <>
//                       <CheckCircle2 className="w-4 h-4 mr-2" />
//                       Mark as Complete
//                     </>
//                   )}
//                 </Button>

//                 {canManageCourses && (user?.role === 'admin' || user?.team === course.team) && (
//                   <Button
//                     variant="outline"
//                     className="border-red-500/30 text-red-300 hover:bg-red-500/10"
//                     onClick={() => deleteMutation.mutate(course.id)}
//                     disabled={deleteMutation.isPending}
//                   >
//                     <Trash2 className="w-4 h-4 mr-2" />
//                     Remove
//                   </Button>
//                 )}
//               </div>

//               <div className="text-xs text-white/40 flex items-center gap-1">
//                 {course.isCompletedByMe ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
//                 Added by {course.createdBy?.name || 'Unknown'}
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       {!filteredCourses.length && (
//         <Card className="bg-white/5 border-dashed border-white/20">
//           <CardContent className="py-12 text-center">
//             <h3 className="text-xl text-white font-semibold mb-2">No courses yet</h3>
//             <p className="text-white/60 mb-4">Start by adding a course link focused on your team's weak area.</p>
//             {canManageCourses && (
//               <Button onClick={() => setIsCreateOpen(true)} className="bg-[#F26B21] hover:bg-[#d95e19] text-white">
//                 <Plus className="w-4 h-4 mr-2" />
//                 Add First Course
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
//         <DialogContent className="bg-[#0D132C] border-white/10 text-white max-w-xl">
//           <DialogHeader>
//             <DialogTitle>Add Training Course</DialogTitle>
//             <DialogDescription className="text-white/60">
//               Add a practical link and assign it to your team.
//             </DialogDescription>
//           </DialogHeader>
//           <form onSubmit={handleCreateCourse} className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="course-title">Course Title</Label>
//               <Input
//                 id="course-title"
//                 value={formData.title}
//                 onChange={(e) => setFormData({ ...formData, title: e.target.value })}
//                 className="bg-white/5 border-white/10 text-white"
//                 required
//               />
//             </div>

//             <div className="space-y-2">
//               <Label htmlFor="course-url">Course Link</Label>
//               <Input
//                 id="course-url"
//                 value={formData.url}
//                 onChange={(e) => setFormData({ ...formData, url: e.target.value })}
//                 className="bg-white/5 border-white/10 text-white"
//                 placeholder="https://..."
//                 required
//               />
//             </div>

//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//               <div className="space-y-2">
//                 <Label htmlFor="course-platform">Platform</Label>
//                 <Input
//                   id="course-platform"
//                   value={formData.platform}
//                   onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
//                   className="bg-white/5 border-white/10 text-white"
//                   placeholder="YouTube, Udemy..."
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="course-focus">Focus Area</Label>
//                 <Input
//                   id="course-focus"
//                   value={formData.focusArea}
//                   onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
//                   className="bg-white/5 border-white/10 text-white"
//                   placeholder="JS, Problem Solving..."
//                 />
//               </div>
//             </div>

//             {isAdmin && (
//               <div className="space-y-2">
//                 <Label htmlFor="course-team">Team</Label>
//                 <Select value={formData.team} onValueChange={(value) => setFormData({ ...formData, team: value })}>
//                   <SelectTrigger className="bg-white/5 border-white/10 text-white">
//                     <SelectValue placeholder="Select team" />
//                   </SelectTrigger>
//                   <SelectContent className="bg-[#0D132C] border-white/10">
//                     {teams?.map((team: any) => (
//                       <SelectItem key={team._id} value={team.name} className="text-white">
//                         {team.name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             )}

//             <div className="space-y-2">
//               <Label htmlFor="course-notes">Context (Optional)</Label>
//               <Input
//                 id="course-notes"
//                 value={formData.notes}
//                 onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
//                 className="bg-white/5 border-white/10 text-white"
//                 placeholder="Why this course for the team"
//               />
//             </div>

//             <DialogFooter>
//               <Button
//                 type="button"
//                 variant="outline"
//                 className="border-white/20 text-white hover:bg-white/10"
//                 onClick={() => setIsCreateOpen(false)}
//               >
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 className="bg-[#F26B21] hover:bg-[#d95e19] text-white"
//                 disabled={createMutation.isPending || !formData.title.trim() || !formData.url.trim()}
//               >
//                 {createMutation.isPending ? 'Adding...' : 'Add Course'}
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default CoursesPage;

import React from 'react'

const CoursesPage = () => {
  return (
    <div className='flex w-fit m-auto rounded-2xl p-4'>
      <img src="/commingSoon.gif" alt="Logo" />
    </div>
  )
}

export default CoursesPage