import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata = {
  title: 'Dashboard : Profile',
};

export default function Page() {
  return <ProfileViewPage />;
}
