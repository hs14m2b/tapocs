Feature: Greeting

  Scenario: Say hello
    When the greeter says hello
    Then I should have heard "hello"

  Scenario: Say hello to me
    Given my name is "matthew"
    When the dynamic greeter says hello
    Then I should have heard "hello matthew"

  Scenario Outline: Saying hello to lots of people
    Given my name is "<name>"
    When the dynamic greeter says hello
    Then I should have heard "<greeting>"

    Examples:
        | name | greeting |
        | John  | hello John |
        | Jane  | hello Jane |
        | bing  | hello bing |
        | blah  | hello blah |
