-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Respondent" (
    "id" TEXT NOT NULL,
    "seq" SERIAL NOT NULL,
    "respondentCode" TEXT NOT NULL,
    "name" TEXT,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "studyProgram" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "aiUsageFrequency" TEXT NOT NULL,
    "platforms" TEXT[],
    "purposes" TEXT[],
    "otherPlatform" TEXT,
    "otherPurpose" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Respondent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionnaireResponse" (
    "id" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionnaireResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusteringRun" (
    "id" TEXT NOT NULL,
    "numberOfClusters" INTEGER NOT NULL,
    "silhouetteScore" DOUBLE PRECISION NOT NULL,
    "inertia" DOUBLE PRECISION NOT NULL,
    "iterations" INTEGER NOT NULL,
    "respondentCount" INTEGER NOT NULL,
    "engine" TEXT NOT NULL,
    "centroids" JSONB NOT NULL,
    "clusterLabels" JSONB NOT NULL,
    "scalerMean" JSONB NOT NULL,
    "scalerStd" JSONB NOT NULL,
    "pcaExplainedVariance" JSONB NOT NULL,
    "preprocessing" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClusteringRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusteringResult" (
    "id" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "clusteringRunId" TEXT NOT NULL,
    "cluster" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dependencyScore" DOUBLE PRECISION NOT NULL,
    "distanceToCentroid" DOUBLE PRECISION NOT NULL,
    "features" JSONB NOT NULL,
    "pcaX" DOUBLE PRECISION NOT NULL,
    "pcaY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClusteringResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_seq_key" ON "Respondent"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Respondent_respondentCode_key" ON "Respondent"("respondentCode");

-- CreateIndex
CREATE INDEX "Respondent_university_idx" ON "Respondent"("university");

-- CreateIndex
CREATE INDEX "Respondent_studyProgram_idx" ON "Respondent"("studyProgram");

-- CreateIndex
CREATE INDEX "Respondent_semester_idx" ON "Respondent"("semester");

-- CreateIndex
CREATE UNIQUE INDEX "Question_code_key" ON "Question"("code");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireResponse_respondentId_key" ON "QuestionnaireResponse"("respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_responseId_questionId_key" ON "Answer"("responseId", "questionId");

-- CreateIndex
CREATE INDEX "ClusteringResult_respondentId_idx" ON "ClusteringResult"("respondentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClusteringResult_clusteringRunId_respondentId_key" ON "ClusteringResult"("clusteringRunId", "respondentId");

-- AddForeignKey
ALTER TABLE "QuestionnaireResponse" ADD CONSTRAINT "QuestionnaireResponse_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "QuestionnaireResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusteringResult" ADD CONSTRAINT "ClusteringResult_respondentId_fkey" FOREIGN KEY ("respondentId") REFERENCES "Respondent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClusteringResult" ADD CONSTRAINT "ClusteringResult_clusteringRunId_fkey" FOREIGN KEY ("clusteringRunId") REFERENCES "ClusteringRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
