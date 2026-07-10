export {
  emptyStaticParams as generateStaticParams,
  mobileDynamicParams as dynamicParams,
} from '@/lib/staticExportHelpers';

import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page() {
  return <ProfileViewPage />;
}
