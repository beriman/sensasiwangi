// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
// @ts-ignore
import { Progress } from "../../components/ui/progress";
// @ts-ignore
import { Badge } from "../../components/ui/badge";
// @ts-ignore
import { Slider } from "../../components/ui/slider";
// @ts-ignore
import { Button } from "../../components/ui/button";
// @ts-ignore
import { Award, Lock, Unlock, Zap } from "lucide-react";
// @ts-ignore
import { REPUTATION_LEVELS } from "../../lib/forum";
// @ts-ignore
import { calculateLevelProgress, getUserPrivileges } from "../../lib/reputation";

export default function ReputationSystemDemo() {
  const [exp, setExp] = useState(300);
  const { progress, currentLevel, nextLevel, expToNextLevel } =
    calculateLevelProgress(exp);
  const userPrivileges = getUserPrivileges(exp);
  const nextLevelPrivileges = nextLevel ? nextLevel.privileges : [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Reputation System Demo
      </h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Experience Points: {exp}</span>
          <Button variant="outline" size="sm" onClick={() => setExp(0)}>
            Reset
          </Button>
        </div>
        <Slider
          value={[exp]}
          min={0}
          max={3000}
          step={50}
          onValueChange={(value) => setExp(value[0])}
          className="mb-4"
        />
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" onClick={() => setExp(Math.max(0, exp - 50))}>
            -50 EXP
          </Button>
          <Button size="sm" onClick={() => setExp(exp + 50)}>
            +50 EXP
          </Button>
          <Button size="sm" onClick={() => setExp(exp + 200)}>
            +200 EXP
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-500" />
              Current Reputation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 self-start">
                  Level {currentLevel.level}: {currentLevel.title}
                </Badge>
                <span className="text-sm text-gray-500">
                  {currentLevel.description}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">
                    {nextLevel
                      ? `Progress to Level ${nextLevel.level}: ${nextLevel.title}`
                      : "Max Level Reached!"}
                  </span>
                  <span className="text-gray-900">{Math.round(progress)}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-2 bg-gray-100 rounded-full"
                />
                <div className="text-xs text-gray-500 text-right">
                  {nextLevel
                    ? `${expToNextLevel} EXP needed for next level`
                    : "Maximum level achieved"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-900 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-amber-500" />
              Privileges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Your Privileges
                </h4>
                <div className="space-y-1">
                  {userPrivileges.map((privilege, index) => (
                    <div
                      key={index}
                      className="flex items-center text-xs text-gray-700"
                    >
                      <Unlock className="h-3 w-3 text-green-500 mr-1" />
                      <span>{privilege}</span>
                    </div>
                  ))}
                </div>
              </div>

              {nextLevel && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Next Level Privileges
                  </h4>
                  <div className="space-y-1">
                    {nextLevelPrivileges.map((privilege, index) => (
                      <div
                        key={index}
                        className="flex items-center text-xs text-gray-500"
                      >
                        <Lock className="h-3 w-3 text-gray-400 mr-1" />
                        <span>{privilege}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-medium text-gray-900">
            All Reputation Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {REPUTATION_LEVELS.map((level) => (
              <div
                key={level.level}
                className={`p-3 border rounded-lg ${currentLevel.level === level.level ? "border-purple-300 bg-purple-50" : "border-gray-200"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <Badge
                    className={`${currentLevel.level === level.level ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    Level {level.level}: {level.title}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {level.exp} EXP required
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {level.description}
                </p>
                <div className="space-y-1">
                  {level.privileges.map((privilege, index) => (
                    <div
                      key={index}
                      className="flex items-center text-xs text-gray-700"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mr-2"></div>
                      <span>{privilege}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


