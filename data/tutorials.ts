import { SupportedLanguage } from "../types";

export interface TutorialTopic {
  title: string;
  description: string;
  code: string;
}

export const TUTORIALS: Record<SupportedLanguage, TutorialTopic[]> = {
  [SupportedLanguage.JAVASCRIPT]: [
    {
      title: "1. Variables & Types",
      description: "Learn how to store data. `const` is for values that won't change, `let` is for those that might.",
      code: `const appName = "CodeFlow";
let score = 0;
let isCoding = true;

console.log("Welcome to " + appName);
score = score + 10;
console.log("New Score: " + score);`
    },
    {
      title: "2. Conditionals (If/Else)",
      description: "Make decisions in your code based on conditions.",
      code: `let temperature = 25;

if (temperature > 30) {
  console.log("It's a hot day!");
} else if (temperature > 20) {
  console.log("It's a nice day.");
} else {
  console.log("It's cold!");
}`
    },
    {
      title: "3. Loops",
      description: "Repeat code efficiently using `for` loops.",
      code: `// Count from 1 to 5
for (let i = 1; i <= 5; i++) {
  console.log("Count: " + i);
}`
    },
    {
        title: "4. Functions",
        description: "Reusable blocks of code. Define it once, use it many times.",
        code: `function calculateArea(width, height) {
  return width * height;
}

const room1 = calculateArea(10, 5);
const room2 = calculateArea(4, 3);
console.log("Room 1 Area: " + room1);
console.log("Room 2 Area: " + room2);`
    },
    {
        title: "5. Arrays",
        description: "Lists of items stored in a single variable.",
        code: `const heroes = ["Superman", "Batman", "Wonder Woman"];
console.log(heroes[0]); // Access first item

heroes.push("Flash"); // Add new item
console.log("Team size: " + heroes.length);

heroes.forEach(hero => console.log("Hero: " + hero));`
    }
  ],
  [SupportedLanguage.PYTHON]: [
    {
      title: "1. Variables",
      description: "Python variables are created when you assign a value. No types needed.",
      code: `name = "Alice"
age = 10
height = 1.4

print(f"{name} is {age} years old and {height}m tall.")`
    },
    {
      title: "2. Lists (Arrays)",
      description: "Ordered, changeable collections of items.",
      code: `fruits = ["apple", "banana", "cherry"]
print(fruits[0]) # First item

fruits.append("orange") # Add item
for fruit in fruits:
    print(fruit)`
    },
    {
        title: "3. Dictionaries",
        description: "Store data values in key:value pairs.",
        code: `car = {
  "brand": "Ford",
  "model": "Mustang",
  "year": 1964
}

print(car["model"])
car["year"] = 2020 # Update value
print(car)`
    },
    {
        title: "4. Functions",
        description: "Define functions using `def`.",
        code: `def greet(name):
    return f"Hello, {name}!"

print(greet("Pythonista"))
print(greet("World"))`
    },
    {
        title: "5. Classes (OOP)",
        description: "Object Oriented Programming allows you to create your own types.",
        code: `class Dog:
    def __init__(self, name, breed):
        self.name = name
        self.breed = breed
    
    def bark(self):
        print("Woof!")

my_dog = Dog("Buddy", "Golden Retriever")
print(my_dog.name)
my_dog.bark()`
    }
  ],
  [SupportedLanguage.JAVA]: [
    {
      title: "1. Basic Structure",
      description: "Every Java program needs a class and a main method.",
      code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`
    },
    {
      title: "2. Variables & Types",
      description: "Java is strongly typed.",
      code: `public class Main {
    public static void main(String[] args) {
        int myNum = 5;
        String myText = "Hello";
        boolean isJavaFun = true;
        
        System.out.println(myText + " " + myNum);
    }
}`
    },
    {
        title: "3. Loops",
        description: "While loops run as long as a condition is true.",
        code: `public class Main {
    public static void main(String[] args) {
        int i = 0;
        while (i < 5) {
            System.out.println(i);
            i++;
        }
    }
}`
    },
    {
        title: "4. Methods",
        description: "Methods are code blocks that run when called.",
        code: `public class Main {
    static void myMethod() {
        System.out.println("I just got executed!");
    }

    public static void main(String[] args) {
        myMethod();
        myMethod();
    }
}`
    }
  ],
  [SupportedLanguage.CPP]: [
    {
      title: "1. Input & Output",
      description: "`cin` for input, `cout` for output.",
      code: `#include <iostream>
using namespace std;

int main() {
    int x = 10;
    cout << "Value: " << x << endl;
    return 0;
}`
    },
    {
        title: "2. Pointers",
        description: "A pointer stores the memory address of another variable.",
        code: `#include <iostream>
using namespace std;

int main() {
    string food = "Pizza";
    string* ptr = &food;

    cout << food << endl;
    cout << &food << endl; // Memory address
    cout << ptr << endl;   // Same address
    return 0;
}`
    }
  ],
  [SupportedLanguage.C]: [
    {
      title: "1. Basic I/O",
      description: "Using printf for formatted output.",
      code: `#include <stdio.h>

int main() {
    int id = 101;
    printf("Item ID: %d\n", id);
    return 0;
}`
    },
    {
        title: "2. Structs",
        description: "Group related variables under one name.",
        code: `#include <stdio.h>

struct Point {
  int x;
  int y;
};

int main() {
  struct Point p1;
  p1.x = 10;
  p1.y = 20;
  printf("Point: (%d, %d)", p1.x, p1.y);
  return 0;
}`
    }
  ],
  [SupportedLanguage.GO]: [
    {
      title: "1. Goroutines",
      description: "Lightweight threads for concurrency.",
      code: `package main
import (
    "fmt"
    "time"
)

func say(s string) {
    for i := 0; i < 3; i++ {
        time.Sleep(100 * time.Millisecond)
        fmt.Println(s)
    }
}

func main() {
    go say("world")
    say("hello")
}`
    }
  ],
  [SupportedLanguage.HTML]: [
    {
      title: "1. Basic Structure",
      description: "The skeleton of a webpage.",
      code: `<!DOCTYPE html>
<html>
<body>
  <h1>My Header</h1>
  <p>My paragraph.</p>
</body>
</html>`
    },
    {
      title: "2. Forms & Inputs",
      description: "Collecting user data.",
      code: `<!DOCTYPE html>
<html>
<body>
<form>
  <label>Name:</label>
  <input type="text" placeholder="Your name">
  <button>Submit</button>
</form> 
</body>
</html>`
    },
    {
        title: "3. Styling (CSS)",
        description: "Adding style to HTML elements.",
        code: `<!DOCTYPE html>
<html>
<head>
<style>
  .card {
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 5px;
    background-color: #f9f9f9;
    color: black;
  }
</style>
</head>
<body>
  <div class="card">
    <h3>Card Title</h3>
    <p>Some content inside a card.</p>
  </div>
</body>
</html>`
    }
  ],
  [SupportedLanguage.SQL]: [
    {
      title: "1. Select & Where",
      description: "Querying data.",
      code: `-- Setup
CREATE TABLE Users (ID INT, Name TEXT, Age INT);
INSERT INTO Users VALUES (1, 'Alice', 25);
INSERT INTO Users VALUES (2, 'Bob', 30);

-- Query
SELECT Name FROM Users WHERE Age > 26;`
    }
  ],
  [SupportedLanguage.RUST]: [
    {
      title: "1. Ownership",
      description: "Rust's unique feature for memory safety.",
      code: `fn main() {
    let s1 = String::from("hello");
    let s2 = s1; // Ownership moved to s2
    
    // println!("{}", s1); // This would cause an error!
    println!("{}", s2);
}`
    }
  ],
  [SupportedLanguage.SWIFT]: [
    {
      title: "1. Optionals",
      description: "Handling missing values safely.",
      code: `var myString: String? = nil

if myString != nil {
    print(myString!)
} else {
    print("myString has nil value")
}`
    }
  ]
};