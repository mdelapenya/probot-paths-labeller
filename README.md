# Probot: Paths labeller

> a GitHub App built with [Probot](https://github.com/probot/probot) that adds labels in Pull Requests based on contents of the `paths-labeller.yml` file.

## Usage

1. Create a `paths-labeller.yml` file in your repository, under the `.github` directory.
1. Use your own labels as the keys in the YAML file.
1. Use an array for paths to be added to a label. Pathname Format: glob
1. Use the empty label (`- "":`) for exclusions. Paths here won't receive a label unless precedent labels apply.
1. Wait for new Pull Requests to be opened or synchronised.

An example `paths-labeller.yml` file is shown here:

```yaml
---
- "label1":
  - "*"
- "label2":
  - "*"
- "":
  - "*.pdf"
  - "*.md"
  - "LICENSE"
- "label4":
  - "*.py"
  - "*.rb"
- "label5":
  - "*.py"
  - "*.rb"
- "label6":
  - "folder/**/*.md"
  - "*.doc"
- "label7":
  - "*.doc"
- "label-precedence":
  - "README.md"
```
