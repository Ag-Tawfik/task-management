<?php

namespace Tests\Unit\Models;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_for_user_accepts_model_and_id(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Task::factory()->count(2)->for($user)->create();
        Task::factory()->count(1)->for($other)->create();

        $this->assertCount(2, Task::query()->forUser($user)->get());
        $this->assertCount(2, Task::query()->forUser($user->id)->get());
    }

    public function test_task_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $this->assertTrue($task->user->is($user));
    }
}
