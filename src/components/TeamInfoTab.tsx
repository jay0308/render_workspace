import React from "react";

const TeamInfoTab: React.FC = () => {
  const battingOrder = [
    "Rahul",
    "Mohit/Shiv", 
    "Sandeep",
    "Sanjeev",
    "Jagan/Shehbaz",
    "Arif",
    "Chetan",
    "Deepak",
    "Jay",
    "Sonu",
    "Talib"
  ];

  const benchmarks = [
    {
      category: "Top Order Batters",
      criteria: [
        "Average: 20+ runs",
        "Strike Rate: 100+ minimum"
      ],
      icon: "🏏"
    },
    {
      category: "Full Time Bowlers", 
      criteria: [
        "Economy Rate: ≤ 10.5",
        "Must take wickets consistently"
      ],
      icon: "⚡"
    },
    {
      category: "Underperforming Bowlers",
      criteria: [
        "Economy Rate: > 12.5 without wickets",
        "May not complete quota (Captain's decision)",
        "No arguments allowed"
      ],
      icon: "⚠️"
    }
  ];

  const teamRules = [
    {
      title: "External Players Policy",
      description: "For external players (especially those who came 1-2 times), position decisions are made by Captain and Vice-Captain. Suggestions welcome, but priority goes to regular team members.",
      icon: "👥"
    },
    {
      title: "All-Rounders Flexibility", 
      description: "All-rounders must be flexible with roles - sometimes batting, sometimes bowling, sometimes both (mostly). Role depends on match requirements.",
      icon: "🔄"
    },
    {
      title: "Performance Evaluation",
      description: "Team evaluations and potential batting order changes will be conducted after every 7-8 innings based on benchmark performance.",
      icon: "📊"
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Batting Order Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-teal-50 px-6 py-4 border-b border-teal-100">
          <h2 className="text-xl font-bold text-teal-800 flex items-center gap-2">
            🏏 Current Batting Order
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {battingOrder.map((player, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <span className="font-medium text-gray-800">{player}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Benchmarks Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
          <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2">
            📈 Performance Benchmarks
          </h2>
          <p className="text-sm text-blue-600 mt-1">Evaluations conducted after every 7-8 innings</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benchmarks.map((benchmark, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{benchmark.icon}</span>
                  <h3 className="font-semibold text-gray-800">{benchmark.category}</h3>
                </div>
                <ul className="space-y-2">
                  {benchmark.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      {criterion}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Rules Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
          <h2 className="text-xl font-bold text-orange-800 flex items-center gap-2">
            📋 Team Guidelines & Rules
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {teamRules.map((rule, index) => (
              <div key={index} className="border-l-4 border-orange-300 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{rule.icon}</span>
                  <h3 className="font-semibold text-gray-800">{rule.title}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-yellow-500 text-xl mt-1">⚡</span>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Important Note</h4>
            <p className="text-yellow-700 text-sm">
              All decisions regarding team composition, batting order, and player roles are final and made by the Captain and Vice-Captain. 
              Focus on meeting benchmarks and contributing positively to team performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamInfoTab; 