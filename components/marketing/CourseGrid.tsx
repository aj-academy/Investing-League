import { COURSE_CARDS } from "@/lib/marketing/courses";
import { CourseLearnButton } from "./CourseLearnButton";

function levelClass(level: string) {
  if (level === "Beginner") return "bg-primary/10 text-primary";
  if (level === "Intermediate") return "bg-secondary/10 text-secondary";
  return "bg-red-100 text-red-600";
}

export function CourseGrid({ descriptions }: { descriptions?: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {COURSE_CARDS.map((course) => (
        <div
          key={course.name}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
        >
          <img
            src={course.image}
            alt={course.name}
            className="w-full h-48 object-cover object-top"
          />
          <div className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span
                className={`${levelClass(course.level)} px-3 py-1 rounded-full text-sm font-medium`}
              >
                {course.level}
              </span>
              <span className="text-gray-600 text-sm">{course.weeks}</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.name}</h3>
            {descriptions?.[course.name] && (
              <p className="text-gray-700 mb-4">{descriptions[course.name]}</p>
            )}
            <CourseLearnButton courseName={course.name} />
          </div>
        </div>
      ))}
    </div>
  );
}
