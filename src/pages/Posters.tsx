import { useI18n } from "../i18n";
import PosterSeriesScroll from "../components/PosterSeriesScroll";
import { posterSeriesZh, posterSeriesEn } from "../content/posterSeries";

const PostersPage = () => {
  const { lang } = useI18n();
  const series = lang === "zh" ? posterSeriesZh : posterSeriesEn;

  return (
    <div className="w-full h-screen overflow-hidden">
      <PosterSeriesScroll series={series} />
    </div>
  );
};

export default PostersPage;
