interface HeadingProps {
  title: string;
  description: string;
}

export const Heading: React.FC<HeadingProps> = ({ title, description }) => {
  return (
    <div className="min-w-0 max-w-full">
      <h2 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
        {title}
      </h2>
      <p className="text-muted-foreground mt-1 text-sm break-words">{description}</p>
    </div>
  );
};
