#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 100
#define OT_RATE 200

struct Employee {
    int id;
    char name[50];
    float basicPay;
    int otHours;
    float grossPay;
    float tax;
    float netPay;
};

struct Employee emp[MAX];
int count = 0;

/* Function Prototypes */
void addEmployee();
void calculateSalary(struct Employee *e);
void displayPayslip();
void saveToFile();
void loadFromFile();
void menu();

int main() {
    int choice;

    while(1) {
        menu();
        printf("Enter choice: ");
        scanf("%d", &choice);

        switch(choice) {
            case 1:
                addEmployee();
                break;

            case 2:
                displayPayslip();
                break;

            case 3:
                saveToFile();
                break;

            case 4:
                loadFromFile();
                break;

            case 5:
                printf("Exiting program...\n");
                exit(0);

            default:
                printf("Invalid choice!\n");
        }
    }

    return 0;
}

/* Menu */
void menu() {
    printf("\n===== Payroll System =====\n");
    printf("1. Add Employee\n");
    printf("2. Generate Payslip\n");
    printf("3. Save Records\n");
    printf("4. Load Records\n");
    printf("5. Exit\n");
}

/* Add Employee */
void addEmployee() {
    struct Employee e;

    printf("\nEnter Employee ID: ");
    scanf("%d", &e.id);

    printf("Enter Name: ");
    scanf("%s", e.name);

    printf("Enter Basic Pay: ");
    scanf("%f", &e.basicPay);

    printf("Enter OT Hours: ");
    scanf("%d", &e.otHours);

    calculateSalary(&e);

    emp[count++] = e;

    printf("Employee added successfully!\n");
}

/* Salary Calculation */
void calculateSalary(struct Employee *e) {

    e->grossPay = e->basicPay + (e->otHours * OT_RATE);

    if(e->grossPay < 20000)
        e->tax = e->grossPay * 0.05;

    else if(e->grossPay <= 40000)
        e->tax = e->grossPay * 0.10;

    else
        e->tax = e->grossPay * 0.15;

    e->netPay = e->grossPay - e->tax;
}

/* Generate Payslip */
void displayPayslip() {

    int id, i;
    printf("Enter Employee ID: ");
    scanf("%d", &id);

    for(i = 0; i < count; i++) {

        if(emp[i].id == id) {

            printf("\n------ PAYSLIP ------\n");
            printf("Employee ID : %d\n", emp[i].id);
            printf("Name        : %s\n", emp[i].name);
            printf("Basic Pay   : %.2f\n", emp[i].basicPay);
            printf("OT Hours    : %d\n", emp[i].otHours);
            printf("Gross Pay   : %.2f\n", emp[i].grossPay);
            printf("Tax         : %.2f\n", emp[i].tax);
            printf("Net Pay     : %.2f\n", emp[i].netPay);
            printf("----------------------\n");

            return;
        }
    }

    printf("Employee not found!\n");
}

/* Save Records */
void saveToFile() {

    FILE *fp = fopen("employees.txt", "w");

    if(fp == NULL) {
        printf("Error opening file!\n");
        return;
    }

    for(int i = 0; i < count; i++) {

        fprintf(fp,"%d %s %.2f %d %.2f %.2f %.2f\n",
                emp[i].id,
                emp[i].name,
                emp[i].basicPay,
                emp[i].otHours,
                emp[i].grossPay,
                emp[i].tax,
                emp[i].netPay);
    }

    fclose(fp);

    printf("Records saved successfully!\n");
}

/* Load Records */
void loadFromFile() {

    FILE *fp = fopen("employees.txt", "r");

    if(fp == NULL) {
        printf("No saved records found.\n");
        return;
    }

    count = 0;

    while(fscanf(fp,"%d %s %f %d %f %f %f",
            &emp[count].id,
            emp[count].name,
            &emp[count].basicPay,
            &emp[count].otHours,
            &emp[count].grossPay,
            &emp[count].tax,
            &emp[count].netPay) != EOF) {

        count++;
    }

    fclose(fp);

    printf("Records loaded successfully!\n");
}