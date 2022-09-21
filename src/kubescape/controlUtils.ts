import { KubescapeControl, Severity, ControlStatus } from "./types"

const SeverityCritical = "Critical"
const SeverityHigh = "High"
const SeverityMedium = "Medium"
const SeverityLow = "Low"
const SeverityUnknown = "Unknown"

function calculateSeverity(control: any): Severity {
  const baseScore = control.baseScore
  if (baseScore >= 9) {
    return {
      name: SeverityCritical,
      value: baseScore,
      color: "#7b2936"
    }
  }
  if (baseScore >= 7) {
    return {
      name: SeverityHigh,
      value: baseScore,
      color: "#cc4d4a"
    }
  }
  if (baseScore >= 4) {
    return {
      name: SeverityMedium,
      value: baseScore,
      color: "#e48547"
    }
  }
  if (baseScore >= 1) {
    return {
      name: SeverityLow,
      value: baseScore,
      color: "#bf9745"
    }
  }
  return {
    name: SeverityUnknown,
    value: baseScore,
    color: "#87909c"
  }
}

function calculateStatus(control: any): ControlStatus {
  if (control.failedResources == 0) {
    if (control.totalResources > 0) {
      return {
        title: "Passed",
        icon: "check_circle_outline",
        value: 1,
        color: "#23a71b"
      }
    }
    return {
      title: "Skipped/Irrelevant",
      icon: "help_outline",
      value: 0,
      color: "gray"
    }
  }
  return {
    title: "Failed",
    icon: "highlight_off",
    value: 10,
    color: "#e1449f"
  }
}


export function toKubescapeControl(control: any): KubescapeControl {
  return {
    id: control.id,
    name: control.name,
    failedResources: control.failedResources,
    allResources: control.totalResources,
    riskScore: control.score,
    description: control.description,
    remediation: control.remediation,
    severity: calculateSeverity(control),
    status: calculateStatus(control),
    rawResult: control,
  }
}

export function getFailedControlsById(controls: any[], id: string): KubescapeControl[] {
  return controls.filter(control =>
    control.failedResources > 0 && control.ruleReports?.some(report =>
      report.failedResources > 0 && report.ruleResponses?.some(response =>
        response.alertObject.k8sApiObjects.some(k8sObj => {
          if (k8sObj.apiVersion) {
            return k8sObj.metadata.uid == id
          }
          return k8sObj.apiGroup ?
            k8sObj.relatedObjects.some(relatedObj => relatedObj.metadata.uid == id) : false
        }))
    )
  ).map(control => toKubescapeControl(control));
}

export function getRelatedObjectsFromControl(control: any): any[] {
  const result: any[] = []
  console.log(control);
  control.ruleReports?.forEach(report => {
    if (report.failedResources > 0) {
      report.ruleResponses?.forEach(response => {
        if (response.ruleStatus == "failed") {
          response.alertObject.k8sApiObjects.forEach(k8sObj => {
            result.push(k8sObj)
          })
        }
      })
    }
  })
  return result
}

export function docsUrl(control: KubescapeControl): string {
  return `https://hub.armo.cloud/docs/${control.id.toLocaleLowerCase()}`;
}
